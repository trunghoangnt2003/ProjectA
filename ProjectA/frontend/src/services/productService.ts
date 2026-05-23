import type { Product } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const productService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Product>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Product>>(`/api/products${qs ? `?${qs}` : ""}`);
  },

  list: async () => {
    const res = await productService.getAll({ pageSize: 1000 });
    return res.items;
  },

  create: (input: Omit<Product, "id">) =>
    api<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Omit<Product, "id">) =>
    api<Product>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    api<void>(`/api/products/${id}`, { method: "DELETE" }),
};

/** Ngưỡng tồn kho thấp để cảnh báo. */
export const PRODUCT_LOW_STOCK = 10;
