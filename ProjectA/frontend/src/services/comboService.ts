import type { Combo } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const comboService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Combo>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.startDate) params.append("startDate", opts.startDate);
    if (opts.endDate) params.append("endDate", opts.endDate);
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Combo>>(`/api/combos${qs ? `?${qs}` : ""}`);
  },

  list: async () => {
    const res = await comboService.getAll({ pageSize: 1000 });
    return res.items;
  },

  getById: async (id: string): Promise<Combo> => {
    return api<Combo>(`/api/combos/${id}`);
  },

  create: async (item: Omit<Combo, "id">): Promise<Combo> => {
    return api<Combo>("/api/combos", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  update: async (id: string, item: Partial<Combo>): Promise<Combo> => {
    return api<Combo>(`/api/combos/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  },

  delete: async (id: string): Promise<void> => {
    return api<void>(`/api/combos/${id}`, {
      method: "DELETE",
    });
  },
};
