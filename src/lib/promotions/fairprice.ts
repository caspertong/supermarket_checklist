import type { PromoItem, StorePromos } from "@/lib/types";
import { commonDate, dayPart, keepMajor } from "./filters";

const API = "https://website-api.omni.fairprice.com.sg/api/product/v2";
const TAG = "promotions-boost";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

type FpOffer = { price?: number; validFrom?: string; validTill?: string; shortDescriptionA?: string; description?: string };
type FpProduct = {
  name: string;
  slug: string;
  final_price?: number;
  metaData?: { DisplayUnit?: string };
  offers?: FpOffer[];
};

async function fetchPage(page: number) {
  const params = new URLSearchParams({
    category: TAG,
    url: TAG,
    page: String(page),
    pageType: "tag",
    includeTagDetails: "true",
  });
  const response = await fetch(`${API}?${params}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`FairPrice API ${response.status}`);
  const body = (await response.json()) as { data?: { product?: FpProduct[]; pagination?: { total_pages?: number } } };
  return body.data;
}

function rowFromProduct(product: FpProduct): PromoItem | null {
  const offers = product.offers?.filter((offer) => offer.price != null) ?? [];
  const best = offers.length
    ? offers.reduce((low, offer) => (offer.price! < low.price! ? offer : low))
    : null;
  const price = product.final_price;
  const promoPrice = best?.price ?? null;
  if (price == null && promoPrice == null) return null;
  const previousPrice =
    promoPrice != null && price != null && promoPrice !== price ? price : null;
  const detail =
    offers
      .map((offer) => offer.shortDescriptionA || offer.description || "")
      .join("; ")
      .trim() || null;
  return {
    name: product.name,
    size: product.metaData?.DisplayUnit ?? null,
    price: price ?? null,
    promoPrice,
    previousPrice,
    detail,
    until: dayPart(best?.validTill),
    url: `https://www.fairprice.com.sg/product/${product.slug}`,
  };
}

export async function pullFairpricePromotions(): Promise<StorePromos> {
  const first = await fetchPage(1);
  const totalPages = first?.pagination?.total_pages ?? 1;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const chunkSize = 12;
  const collected: PromoItem[] = [];
  const windows: { from: string | null; till: string | null }[] = [];

  for (let offset = 0; offset < pages.length; offset += chunkSize) {
    const chunk = pages.slice(offset, offset + chunkSize);
    const batches = await Promise.all(chunk.map((page) => fetchPage(page)));
    for (const data of batches) {
      for (const product of data?.product ?? []) {
        const row = rowFromProduct(product);
        if (!row) continue;
        const offer = product.offers?.find((entry) => entry.validTill);
        windows.push({ from: dayPart(offer?.validFrom), till: dayPart(offer?.validTill) });
        collected.push(row);
      }
    }
  }

  const fetchedAt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(" ", "T")
    .concat("+08:00");

  return {
    fetchedAt,
    validFrom: commonDate(windows.map((row) => row.from)),
    validTill: commonDate(windows.map((row) => row.till)),
    note: "At least 30% off. Bundle deals and the monthly list are left out.",
    leafletUrl: null,
    items: keepMajor(collected),
  };
}
