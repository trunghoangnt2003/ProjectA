import type { Court } from "../types/domain";
import { api } from "./api";

interface ApiCourt {
  id: string;
  name: string;
  zone: string;
  type: string;
  imageUrl?: string;
  priceSlots: { start: string; end: string; pricePerHour: number }[];
  weekendSurcharge: number;
  holidaySurcharge: number;
  memberDiscount: number;
  status: string;
}

export const courtService = {
  list: async (): Promise<Court[]> => {
    const data = await api<ApiCourt[]>("/api/public/courts");
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      zone: c.zone,
      type: c.type as Court["type"],
      imageUrl: c.imageUrl,
      priceSlots: c.priceSlots,
      weekendSurcharge: c.weekendSurcharge,
      holidaySurcharge: c.holidaySurcharge,
      memberDiscount: c.memberDiscount,
    }));
  },
};
