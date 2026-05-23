import { api } from "./api";
import type { MembershipPlan } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const membershipService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<MembershipPlan>> => {
    const res = await api.get("/memberships", { params: options });
    return res.data;
  },

  create: async (data: Omit<MembershipPlan, "id">): Promise<MembershipPlan> => {
    const res = await api.post("/memberships", data);
    return res.data;
  },

  update: async (id: string, data: Partial<MembershipPlan>): Promise<void> => {
    await api.put(`/memberships/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/memberships/${id}`);
  },
};
