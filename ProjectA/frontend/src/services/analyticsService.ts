import type { Booking, Court, Order } from "../types/domain";
import { SLOT_COUNT, rangeToSlots, toMinutes } from "../lib/time";
import { salesRevenueOn } from "./orderService";

/**
 * Tổng hợp số liệu cho Dashboard & Reports — toàn bộ là hàm thuần (pure),
 * nhận dữ liệu đã load từ các service rồi tính, dễ test và đổi nguồn.
 */

const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const TODAY = isoOf(new Date());

/** Lượt "thật" (chiếm chỗ/đếm vào hoạt động): trừ đã hủy & không đến. */
const activeStatuses: Booking["status"][] = ["pending", "confirmed", "playing", "completed"];
/** Doanh thu sân: lượt đã xác nhận/đang chơi/hoàn thành (không tính hủy & no-show). */
const revenueStatuses: Booking["status"][] = ["confirmed", "playing", "completed"];

function bookingRevenueOn(bookings: Booking[], isoDate: string): number {
  return bookings
    .filter((b) => b.date === isoDate && revenueStatuses.includes(b.status))
    .reduce((s, b) => s + b.totalPrice, 0);
}

export interface OverviewMetrics {
  revenueToday: number; // sân + bán hàng
  bookingsToday: number; // không tính đã hủy
  operationalCourts: number; // sân không bảo trì
  totalCourts: number;
  freeCourtsNow: number; // sân operational chưa có người chơi lúc này
  playingNow: number; // số lượt đang chơi (theo giờ hiện tại)
  occupancyToday: number; // % lấp đầy hôm nay theo slot
}

/** Chỉ số tổng quan cho ngày hôm nay (live theo giờ hiện tại). */
export function overviewMetrics(
  bookings: Booking[],
  courts: Court[],
  orders: Order[]
): OverviewMetrics {
  const todays = bookings.filter(
    (b) => b.date === TODAY && activeStatuses.includes(b.status)
  );

  // "Đang chơi" = lượt đã check-in (status playing).
  const playing = todays.filter((b) => b.status === "playing");
  const busyCourts = new Set(playing.map((b) => b.courtName));

  const operationalCourts = courts.filter((c) => c.status !== "maintenance").length;

  // Tỉ lệ lấp đầy = số ô đã đặt hôm nay / (số sân vận hành × số ô/ngày).
  let bookedSlots = 0;
  for (const b of todays) {
    const r = rangeToSlots(b.startTime, b.endTime);
    if (r) bookedSlots += r.endSlot - r.startSlot;
  }
  const capacity = operationalCourts * SLOT_COUNT;
  const occupancyToday = capacity > 0 ? Math.round((bookedSlots / capacity) * 100) : 0;

  return {
    revenueToday: bookingRevenueOn(bookings, TODAY) + salesRevenueOn(orders, TODAY),
    bookingsToday: todays.length,
    operationalCourts,
    totalCourts: courts.length,
    freeCourtsNow: Math.max(operationalCourts - busyCourts.size, 0),
    playingNow: playing.length,
    occupancyToday,
  };
}

/** Danh sách ngày (yyyy-mm-dd) từ cũ → mới, gồm hôm nay, dài `days` ngày. */
export function lastNDays(days: number): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(isoOf(d));
  }
  return out;
}

const dayLabel = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

/** Doanh thu theo ngày: tách tiền sân và tiền bán hàng. */
export function revenueByDay(bookings: Booking[], orders: Order[], days: string[]) {
  return days.map((iso) => ({
    date: dayLabel(iso),
    "Tiền sân": bookingRevenueOn(bookings, iso),
    "Bán hàng": salesRevenueOn(orders, iso),
  }));
}

/** Số lượt đặt theo ngày + số lượt hủy. */
export function bookingTrends(bookings: Booking[], days: string[]) {
  return days.map((iso) => {
    const ofDay = bookings.filter((b) => b.date === iso);
    return {
      date: dayLabel(iso),
      "Lượt đặt": ofDay.filter((b) => b.status !== "cancelled").length,
      "Hủy": ofDay.filter((b) => b.status === "cancelled").length,
    };
  });
}

/** Phân bố lượt đặt theo khung giờ bắt đầu (trong khoảng ngày). */
export function peakHours(bookings: Booking[], fromIso: string) {
  const counts = new Map<number, number>();
  for (const b of bookings) {
    if (b.date < fromIso || b.status === "cancelled") continue;
    const h = Math.floor(toMinutes(b.startTime) / 60);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  const hours = Array.from(counts.keys()).sort((a, b) => a - b);
  if (hours.length === 0) return [];
  const min = hours[0];
  const max = hours[hours.length - 1];
  const out: { hour: string; "Lượt đặt": number }[] = [];
  for (let h = min; h <= max; h++) {
    out.push({ hour: `${String(h).padStart(2, "0")}h`, "Lượt đặt": counts.get(h) ?? 0 });
  }
  return out;
}

/** Top khách hàng theo tổng chi tiêu (tiền sân + bán hàng) trong khoảng. */
export function topCustomers(
  bookings: Booking[],
  orders: Order[],
  fromIso: string,
  limit = 6
) {
  const spend = new Map<string, number>();
  const add = (name: string | undefined, amount: number) => {
    if (!name || name === "Khách lẻ") return;
    spend.set(name, (spend.get(name) ?? 0) + amount);
  };
  for (const b of bookings) {
    if (b.date >= fromIso && revenueStatuses.includes(b.status)) {
      add(b.customerName, b.totalPrice);
    }
  }
  for (const o of orders) {
    if (o.createdAt.slice(0, 10) >= fromIso) add(o.customerName, o.total);
  }
  return Array.from(spend.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/** Hiệu suất theo sân: doanh thu + số lượt đặt (trong khoảng). */
export function courtPerformance(bookings: Booking[], fromIso: string) {
  const rev = new Map<string, number>();
  const cnt = new Map<string, number>();
  for (const b of bookings) {
    if (b.date < fromIso || !activeStatuses.includes(b.status)) continue;
    cnt.set(b.courtName, (cnt.get(b.courtName) ?? 0) + 1);
    if (revenueStatuses.includes(b.status)) {
      rev.set(b.courtName, (rev.get(b.courtName) ?? 0) + b.totalPrice);
    }
  }
  return Array.from(new Set([...rev.keys(), ...cnt.keys()]))
    .map((court) => ({
      court,
      "Doanh thu": rev.get(court) ?? 0,
      "Lượt đặt": cnt.get(court) ?? 0,
    }))
    .sort((a, b) => b["Doanh thu"] - a["Doanh thu"]);
}
