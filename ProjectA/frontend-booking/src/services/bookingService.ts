import type { Booking } from "../types/domain";
import { api } from "./api";

/** API response shape from the public booking endpoint. */
interface ApiBooking {
  id: string;
  code: string;
  date: string;
  courtName: string;
  customerName: string;
  phone: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
}

/**
 * Chuyển đổi từ API format (startTime/endTime HH:mm) sang FE format (startSlot/endSlot).
 * Slot 0 = 05:00, mỗi slot 30 phút. endSlot KHÔNG gồm.
 */
function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 5) * 2 + Math.floor(m / 30);
}

/** Chuyển đổi từ slot sang HH:mm. */
function slotToTime(slot: number): string {
  const totalMinutes = slot * 30 + 5 * 60;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Map từ courtName → courtId (dùng danh sách đã load). */
let courtNameMap: Map<string, string> | null = null;
let courtIdMap: Map<string, string> | null = null;

export function setCourtMaps(courts: { id: string; name: string }[]) {
  courtNameMap = new Map(courts.map((c) => [c.name, c.id]));
  courtIdMap = new Map(courts.map((c) => [c.id, c.name]));
}

function toBooking(b: ApiBooking): Booking {
  return {
    id: b.id,
    code: b.code,
    date: b.date,
    courtId: courtNameMap?.get(b.courtName) ?? b.courtName,
    startSlot: timeToSlot(b.startTime),
    endSlot: timeToSlot(b.endTime),
    customerName: b.customerName,
    phone: b.phone,
    totalPrice: b.totalPrice,
    status: b.status as Booking["status"],
  };
}

export const bookingService = {
  listByDate: async (date: string): Promise<Booking[]> => {
    const data = await api<ApiBooking[]>(`/api/public/bookings?date=${date}`);
    return data.map(toBooking);
  },

  /** Tra cứu theo mã đặt sân hoặc số điện thoại. */
  search: async (query: string): Promise<Booking[]> => {
    const q = query.trim();
    if (!q) return [];
    const data = await api<ApiBooking[]>(`/api/public/bookings/search?q=${encodeURIComponent(q)}`);
    return data.map(toBooking);
  },

  create: async (input: Omit<Booking, "id" | "code" | "status">): Promise<Booking> => {
    const courtName = courtIdMap?.get(input.courtId) ?? input.courtId;
    const body = {
      date: input.date,
      courtName,
      customerName: input.customerName,
      phone: input.phone,
      startTime: slotToTime(input.startSlot),
      endTime: slotToTime(input.endSlot),
      totalPrice: input.totalPrice,
    };
    const data = await api<ApiBooking>("/api/public/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return toBooking(data);
  },

  /** Lượt đặt của một khách (theo SĐT), mới nhất trước. */
  listByPhone: async (phone: string): Promise<Booking[]> => {
    const digits = phone.replace(/\D/g, "");
    const data = await api<ApiBooking[]>(`/api/public/bookings/by-phone/${encodeURIComponent(digits)}`);
    return data.map(toBooking);
  },

  /** Khách tự hủy lượt đặt (chỉ khi đang chờ xác nhận / đã xác nhận). */
  cancel: async (id: string): Promise<Booking | null> => {
    const data = await api<ApiBooking>(`/api/public/bookings/${id}/cancel`, {
      method: "PUT",
    });
    return toBooking(data);
  },
};
