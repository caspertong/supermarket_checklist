export type Unit = "pcs" | "pkt" | "kg";
export type StoreName = "fairprice" | "shengsiong";

export type ItemDTO = {
  id: string;
  name: string;
  slug: string | null;
  image: string;
  quantity: number;
  unit: Unit;
  note: string | null;
  checked: boolean;
  addedBy: string | null;
  checkedBy: string | null;
};

export type ListDTO = {
  date: string;
  dateLabel: string;
  store: StoreName | null;
  revision: number;
  items: ItemDTO[];
};

export type PromoItem = {
  name: string;
  size: string | null;
  price: number | null;
  promoPrice: number | null;
  previousPrice: number | null;
  detail: string | null;
  until: string | null;
  url: string;
};

export type StorePromos = {
  fetchedAt: string | null;
  validFrom: string | null;
  validTill: string | null;
  note: string | null;
  leafletUrl: string | null;
  items: PromoItem[];
};

export type PromotionsDTO = Record<StoreName, StorePromos>;

export type ArchiveEntry = {
  date: string;
  dateLabel: string;
  store: StoreName | null;
  total: number;
  checked: number;
};

export type SessionDTO =
  | { state: "setup" }
  | { state: "login" }
  | { state: "in"; member: { id: string; name: string; slot: number } };
