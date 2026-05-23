import { api } from "./api";
import type { Promotion } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const promotionService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<Promotion>> => {
    const res = await api.get("/promotions", { params: options });
    return res.data;
  },

  create: async (data: Omit<Promotion, "id">): Promise<Promotion> => {
    const res = await api.post("/promotions", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Promotion>): Promise<void> => {
    await api.put(`/promotions/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/promotions/${id}`);
  },
};
