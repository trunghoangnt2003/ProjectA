import type { Court } from "../types/domain";
import { api } from "./api";

export interface CourtService {
  getAll: (qs?: string) => Promise<PagedResult<Court>>;
  list: () => Promise<Court[]>;
  create: (input: Omit<Court, "id">) => Promise<Court>;
  update: (id: string, input: Omit<Court, "id">) => Promise<Court>;
  remove: (id: string) => Promise<void>;
}

export const courtService: CourtService = {
  getAll: async (qs?: string) => api<PagedResult<Court>>(`/api/courts${qs ? `?${qs}` : ""}`),
  list: async () => {
    const res = await api<PagedResult<Court>>("/api/courts?pageSize=1000");
    return res.items;
  },

  create: (input) =>
    api<Court>("/api/courts", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id, input) =>
    api<Court>(`/api/courts/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id) =>
    api<void>(`/api/courts/${id}`, { method: "DELETE" }),
};
