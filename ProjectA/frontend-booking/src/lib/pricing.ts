import type { BookingExtra, Court, PriceSlot } from "../types/domain";
import { formatVnd } from "./format";
import { slotStart, SLOT_MINUTES } from "./time";

/** Ngày lễ (mock) — yyyy-mm-dd. */
const HOLIDAYS = new Set(["2026-01-01", "2026-04-30", "2026-05-01", "2026-09-02"]);

export function isWeekend(dateIso: string): boolean {
  const d = new Date(dateIso + "T00:00:00").getDay();
  return d === 0 || d === 6;
}
export function isHoliday(dateIso: string): boolean {
  return HOLIDAYS.has(dateIso);
}

/** % phụ thu áp dụng cho ngày: ưu tiên ngày lễ, rồi cuối tuần. */
export function surchargePercent(court: Court, dateIso: string): number {
  if (isHoliday(dateIso)) return court.holidaySurcharge;
  if (isWeekend(dateIso)) return court.weekendSurcharge;
  return 0;
}

export function surchargeLabel(court: Court, dateIso: string): string | null {
  if (isHoliday(dateIso)) return `Ngày lễ +${court.holidaySurcharge}%`;
  if (isWeekend(dateIso)) return `Cuối tuần +${court.weekendSurcharge}%`;
  return null;
}

/** Tiền sân của 1 dải đã gồm phụ thu cuối tuần/lễ. */
export function courtTotal(
  court: Court,
  startSlot: number,
  endSlot: number,
  dateIso: string
): number {
  const base = priceForSlots(court.priceSlots, startSlot, endSlot);
  const pct = surchargePercent(court, dateIso);
  return Math.round(base * (1 + pct / 100));
}

export function extrasTotal(extras: BookingExtra[]): number {
  return extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Giá/giờ tại một thời điểm "HH:mm"; null nếu không khung nào phủ. */
export function priceAt(slots: PriceSlot[], time: string): number | null {
  const t = toMinutes(time);
  const slot = slots.find((s) => {
    const start = toMinutes(s.start);
    const end = toMinutes(s.end);
    return start <= end ? t >= start && t < end : t >= start || t < end;
  });
  return slot ? slot.pricePerHour : null;
}

export function priceRange(slots: PriceSlot[]): { min: number; max: number } | null {
  if (slots.length === 0) return null;
  const prices = slots.map((s) => s.pricePerHour);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatPriceRange(slots: PriceSlot[]): string {
  const range = priceRange(slots);
  if (!range) return "—";
  return range.min === range.max
    ? `${formatVnd(range.min)}/giờ`
    : `${formatVnd(range.min)}–${formatVnd(range.max)}/giờ`;
}

/** Tổng tiền cho dải ô [startSlot, endSlot) theo bảng giá khung giờ. */
export function priceForSlots(
  priceSlots: PriceSlot[],
  startSlot: number,
  endSlot: number
): number {
  let total = 0;
  for (let i = startSlot; i < endSlot; i++) {
    const p = priceAt(priceSlots, slotStart(i));
    if (p != null) total += (p * SLOT_MINUTES) / 60; // mỗi ô 30 phút
  }
  return Math.round(total);
}
