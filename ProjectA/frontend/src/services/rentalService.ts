import type { Rental } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const rentalService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Rental>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.startDate) params.append("startDate", opts.startDate);
    if (opts.endDate) params.append("endDate", opts.endDate);
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Rental>>(`/api/rentals${qs ? `?${qs}` : ""}`);
  },

  getById: async (id: string): Promise<Rental> => {
    return api<Rental>(`/api/rentals/${id}`);
  },

  create: async (item: Omit<Rental, "id" | "code" | "status" | "returnedAt">): Promise<Rental> => {
    return api<Rental>("/api/rentals", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  returnRental: async (id: string): Promise<Rental> => {
    return api<Rental>(`/api/rentals/${id}/return`, {
      method: "PUT",
    });
  },

  delete: async (id: string): Promise<void> => {
    return api<void>(`/api/rentals/${id}`, {
      method: "DELETE",
    });
  },
};
