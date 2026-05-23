import type { Payment } from "../types/domain";
import type { PagedResult, QueryOptions } from "../types";
import { api } from "./api";

export const paymentService = {
  getAll: async (opts: QueryOptions = {}): Promise<PagedResult<Payment>> => {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page.toString());
    if (opts.pageSize) params.append("pageSize", opts.pageSize.toString());
    if (opts.startDate) params.append("startDate", opts.startDate);
    if (opts.endDate) params.append("endDate", opts.endDate);
    if (opts.sortBy) params.append("sortBy", opts.sortBy);
    if (opts.sortDesc !== undefined) params.append("sortDesc", opts.sortDesc.toString());
    if (opts.search) params.append("search", opts.search);

    const qs = params.toString();
    return api<PagedResult<Payment>>(`/api/payments${qs ? `?${qs}` : ""}`);
  },

  create: (input: Omit<Payment, "id">) =>
    api<Payment>("/api/payments", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Omit<Payment, "id">) =>
    api<Payment>(`/api/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  delete: (id: string) =>
    api<void>(`/api/payments/${id}`, { method: "DELETE" }),
};

/** Tổng thực thu trong ngày (chỉ khoản đã `paid`). */
export function paidRevenueOn(payments: Payment[], isoDate: string): number {
  return payments
    .filter((p) => p.status === "paid" && (p.paidAt ?? p.createdAt).slice(0, 10) === isoDate)
    .reduce((sum, p) => sum + p.amount, 0);
}
