import { api } from "./api";
import type { CashierShift } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const cashierShiftService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<CashierShift>> => {
    const res = await api.get("/cashiershifts", { params: options });
    return res.data;
  },

  create: async (data: Omit<CashierShift, "id">): Promise<CashierShift> => {
    const res = await api.post("/cashiershifts", data);
    return res.data;
  },

  update: async (id: string, data: Partial<CashierShift>): Promise<void> => {
    await api.put(`/cashiershifts/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cashiershifts/${id}`);
  },
};
