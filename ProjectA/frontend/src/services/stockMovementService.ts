import type { StockMovement } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const stockMovementService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<StockMovement>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.startDate) params.append("startDate", opts.startDate);
    if (opts.endDate) params.append("endDate", opts.endDate);
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<StockMovement>>(`/api/stock-movements${qs ? `?${qs}` : ""}`);
  },

  create: async (item: Omit<StockMovement, "id" | "createdAt" | "balanceAfter">): Promise<StockMovement> => {
    return api<StockMovement>("/api/stock-movements", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },
};
