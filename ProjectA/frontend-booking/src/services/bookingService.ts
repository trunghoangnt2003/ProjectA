import type { Booking } from "../types/domain";
import { mockDelay, newId } from "./mock/mockClient";

const todayIso = new Date().toISOString().slice(0, 10);

/** Sinh mã đặt sân dạng BK-xxxx. */
function genCode(): string {
  return "BK-" + Math.floor(1000 + Math.random() * 9000);
}

// Vài lượt đặt sẵn cho hôm nay (slot index: 0 = 05:00, mỗi ô 30 phút).
let bookings: Booking[] = [
  { id: "seed1", code: "BK-1001", date: todayIso, courtId: "c1", startSlot: 0, endSlot: 2, customerName: "Khách lẻ", phone: "0901234567", totalPrice: 80000, status: "confirmed" },
  { id: "seed2", code: "BK-1002", date: todayIso, courtId: "c2", startSlot: 22, endSlot: 26, customerName: "Anh Nam", phone: "0912345678", totalPrice: 260000, status: "confirmed" },
  { id: "seed3", code: "BK-1003", date: todayIso, courtId: "c3", startSlot: 26, endSlot: 30, customerName: "CLB Cầu Lông", phone: "0923456789", totalPrice: 260000, status: "confirmed" },
  { id: "seed4", code: "BK-1004", date: todayIso, courtId: "c6", startSlot: 24, endSlot: 28, customerName: "Chị Hà", phone: "0934567890", totalPrice: 500000, status: "pending" },
];

export const bookingService = {
  listByDate: (date: string) =>
    mockDelay(bookings.filter((b) => b.date === date)),

  /** Tra cứu theo mã đặt sân hoặc số điện thoại. */
  search: (query: string) => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const result = q
      ? bookings.filter(
          (b) =>
            b.code.toLowerCase() === q ||
            b.code.toLowerCase().includes(q) ||
            (digits.length >= 4 && b.phone.replace(/\D/g, "").includes(digits))
        )
      : [];
    return mockDelay(
      [...result].sort((a, b) => (a.date < b.date ? 1 : -1))
    );
  },

  create: (input: Omit<Booking, "id" | "code" | "status">) => {
    const created: Booking = {
      ...input,
      id: newId(),
      code: genCode(),
      status: "pending", // mới đặt -> chờ xác nhận
    };
    bookings = [...bookings, created];
    return mockDelay(created);
  },

  /** Lượt đặt của một khách (theo SĐT), mới nhất trước. */
  listByPhone: (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const result = bookings.filter((b) => b.phone.replace(/\D/g, "") === digits);
    return mockDelay([...result].sort((a, b) => (a.date < b.date ? 1 : -1)));
  },

  /** Khách tự hủy lượt đặt (chỉ khi đang chờ xác nhận / đã xác nhận). */
  cancel: (id: string) => {
    bookings = bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b));
    return mockDelay(bookings.find((b) => b.id === id) ?? null);
  },
};
