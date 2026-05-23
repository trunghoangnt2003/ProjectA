import type { ExtraItem } from "../types/domain";
import { api } from "./api";

interface ApiProduct {
  id: string;
  name: string;
  category: string;
  price: number;
}

export const extrasService = {
  list: async (): Promise<ExtraItem[]> => {
    const data = await api<ApiProduct[]>("/api/public/products");
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      group: p.category,
      price: p.price,
    }));
  },
};
