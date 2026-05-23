import type { Supply } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const supplyService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Supply>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Supply>>(`/api/supplies${qs ? `?${qs}` : ""}`);
  },

  list: async () => {
    const res = await supplyService.getAll({ pageSize: 1000 });
    return res.items;
  },

  create: (input: Omit<Supply, "id">) =>
    api<Supply>("/api/supplies", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Omit<Supply, "id">) =>
    api<Supply>(`/api/supplies/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    api<void>(`/api/supplies/${id}`, { method: "DELETE" }),
};
