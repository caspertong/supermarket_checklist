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
