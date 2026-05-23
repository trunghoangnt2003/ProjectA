import { api } from "./api";
import type { Attendance } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const attendanceService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<Attendance>> => {
    const res = await api.get("/attendances", { params: options });
    return res.data;
  },

  create: async (data: Omit<Attendance, "id">): Promise<Attendance> => {
    const res = await api.post("/attendances", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Attendance>): Promise<void> => {
    await api.put(`/attendances/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/attendances/${id}`);
  },
};
