import type { Customer } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const customerService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Customer>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Customer>>(`/api/customers${qs ? `?${qs}` : ""}`);
  },

  list: async () => {
    const res = await customerService.getAll({ pageSize: 1000 });
    return res.items;
  },

  create: (input: Omit<Customer, "id">) =>
    api<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Omit<Customer, "id">) =>
    api<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    api<void>(`/api/customers/${id}`, { method: "DELETE" }),
};
