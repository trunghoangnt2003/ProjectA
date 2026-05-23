import { api } from "./api";
import type { AppNotification, AutomationRule } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const notificationService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<AppNotification>> => {
    const res = await api.get("/notifications", { params: options });
    return res.data;
  },

  create: async (data: Omit<AppNotification, "id">): Promise<AppNotification> => {
    const res = await api.post("/notifications", data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

export const automationService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<AutomationRule>> => {
    const res = await api.get("/automationrules", { params: options });
    return res.data;
  },

  update: async (id: string, data: Partial<AutomationRule>): Promise<void> => {
    await api.put(`/automationrules/${id}`, data);
  },
};
