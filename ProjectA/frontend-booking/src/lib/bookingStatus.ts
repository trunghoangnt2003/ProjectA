import type { Booking } from "../types/domain";
import { slotStart, slotEnd } from "./time";

export type PlayStatusKey = "pending" | "upcoming" | "playing" | "finished" | "cancelled";

export interface PlayStatus {
  key: PlayStatusKey;
  label: string;
  color: string; // màu Mantine
}

/** Ghép ngày + "HH:mm" thành Date. "24:00" -> 00:00 ngày hôm sau. */
function toDate(dateIso: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(dateIso + "T00:00:00");
  d.setHours(h, m, 0, 0); // h=24 -> tự chuyển sang 00:00 ngày kế tiếp
  return d;
}

/**
 * Trạng thái hiển thị cho khách:
 * - chờ xác nhận (chưa được duyệt)
 * - sắp tới giờ / đang giờ chơi / đã chơi xong (đã xác nhận, theo thời gian thực)
 */
export function getPlayStatus(booking: Booking, now: Date = new Date()): PlayStatus {
  if (booking.status === "cancelled") {
    return { key: "cancelled", label: "Đã hủy", color: "red" };
  }
  if (booking.status === "pending") {
    return { key: "pending", label: "Chờ xác nhận", color: "yellow" };
  }
  const start = toDate(booking.date, slotStart(booking.startSlot));
  const end = toDate(booking.date, slotEnd(booking.endSlot - 1));

  if (now < start) return { key: "upcoming", label: "Sắp tới giờ", color: "blue" };
  if (now < end) return { key: "playing", label: "Đang giờ chơi", color: "brand" };
  return { key: "finished", label: "Đã chơi xong", color: "gray" };
}
