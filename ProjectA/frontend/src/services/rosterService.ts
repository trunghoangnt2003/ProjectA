import { api } from "./api";
import type { ShiftAssignment } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const rosterService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<ShiftAssignment>> => {
    const res = await api.get("/rosters", { params: options });
    return res.data;
  },

  create: async (data: Omit<ShiftAssignment, "id">): Promise<ShiftAssignment> => {
    const res = await api.post("/rosters", data);
    return res.data;
  },

  update: async (id: string, data: Partial<ShiftAssignment>): Promise<void> => {
    await api.put(`/rosters/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/rosters/${id}`);
  },
};

export function mondayOf(base = new Date()): Date {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7; // 0 = thứ Hai
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekDays(base = new Date()): string[] {
  const mon = mondayOf(base);
  const isoOf = (d: Date) => d.toISOString().slice(0, 10);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(d.getDate() + i);
    return isoOf(d);
  });
}
