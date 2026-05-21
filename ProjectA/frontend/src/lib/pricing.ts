import type { PriceSlot } from "../types/domain";
import { formatVnd } from "./format";

/** "HH:mm" -> số phút trong ngày. "24:00" = 1440. */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Giá/giờ tại một thời điểm; null nếu không khung giờ nào phủ. */
export function priceAt(slots: PriceSlot[], time: string): number | null {
  const t = toMinutes(time);
  const slot = slots.find((s) => {
    const start = toMinutes(s.start);
    const end = toMinutes(s.end);
    return start <= end
      ? t >= start && t < end
      : t >= start || t < end; // khung qua nửa đêm
  });
  return slot ? slot.pricePerHour : null;
}

/** Khoảng giá min–max trong các khung. */
export function priceRange(slots: PriceSlot[]): { min: number; max: number } | null {
  if (slots.length === 0) return null;
  const prices = slots.map((s) => s.pricePerHour);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Hiển thị gọn: "80.000 ₫" nếu đồng giá, hoặc "80.000 – 130.000 ₫". */
export function formatPriceRange(slots: PriceSlot[]): string {
  const range = priceRange(slots);
  if (!range) return "—";
  return range.min === range.max
    ? `${formatVnd(range.min)}/giờ`
    : `${formatVnd(range.min)} – ${formatVnd(range.max)}/giờ`;
}

/** Tính tiền cho 1 khoảng đặt, tính theo từng giờ (giá có thể đổi giữa các giờ). */
export function estimateBookingPrice(
  slots: PriceSlot[],
  startTime: string,
  endTime: string
): number {
  const start = toMinutes(startTime);
  let end = toMinutes(endTime);
  if (end <= start) end += 1440; // qua nửa đêm
  let total = 0;
  // cộng theo từng block 30 phút để bám sát khung giá
  for (let t = start; t < end; t += 30) {
    const hhmm = `${String(Math.floor((t % 1440) / 60)).padStart(2, "0")}:${String(
      (t % 1440) % 60
    ).padStart(2, "0")}`;
    const p = priceAt(slots, hhmm);
    if (p != null) total += p / 2; // 30 phút = nửa giá giờ
  }
  return Math.round(total);
}
