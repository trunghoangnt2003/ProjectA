import type { Booking } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const bookingService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Booking>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.startDate) params.append("startDate", opts.startDate);
    if (opts.endDate) params.append("endDate", opts.endDate);
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Booking>>(`/api/bookings${qs ? `?${qs}` : ""}`);
  },

  list: async () => {
    const res = await bookingService.getAll({ pageSize: 1000 });
    return res.items;
  },

  create: (input: Omit<Booking, "id">) =>
    api<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Omit<Booking, "id">) =>
    api<Booking>(`/api/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  delete: (id: string) =>
    api<void>(`/api/bookings/${id}`, { method: "DELETE" }),
};
