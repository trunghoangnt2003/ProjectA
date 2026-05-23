import type { Order } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export interface OrderService {
  getAll: (opts?: QueryOptions) => Promise<PagedResult<Order>>;
  list: () => Promise<Order[]>;
  create: (input: Omit<Order, "id">) => Promise<Order>;
  update: (id: string, input: Omit<Order, "id">) => Promise<Order>;
  remove: (id: string) => Promise<void>;
}

export const orderService: OrderService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Order>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.startDate) params.append("startDate", opts.startDate);
    if (opts.endDate) params.append("endDate", opts.endDate);
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Order>>(`/api/orders${qs ? `?${qs}` : ""}`);
  },

  list: async () => {
    const res = await orderService.getAll({ pageSize: 1000 });
    return res.items;
  },

  create: (input) =>
    api<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Orders don't have PUT/DELETE in backend, stub for interface compat
  update: (_id, _input) => Promise.reject(new Error("Not implemented")),
  remove: (_id) => Promise.reject(new Error("Not implemented")),
};

/** Tổng doanh thu bán hàng trong ngày (yyyy-mm-dd). */
export function salesRevenueOn(orders: Order[], isoDate: string): number {
  return orders
    .filter((o) => o.createdAt.slice(0, 10) === isoDate)
    .reduce((sum, o) => sum + o.total, 0);
}
