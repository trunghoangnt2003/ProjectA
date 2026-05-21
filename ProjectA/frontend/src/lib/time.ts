/** Lưới thời gian cho lịch sân: 30 phút/ô, 05:00–24:00. */

export const DAY_START_MIN = 5 * 60; // 05:00
export const SLOT_MINUTES = 30;
export const SLOT_COUNT = ((24 - 5) * 60) / SLOT_MINUTES; // 38 ô

function minutesToHHmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "HH:mm" -> số phút trong ngày. "24:00" = 1440. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Giờ bắt đầu của ô (gồm). */
export function slotStart(i: number): string {
  return minutesToHHmm(DAY_START_MIN + i * SLOT_MINUTES);
}

/** Danh sách chỉ số ô. */
export const ALL_SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i);

/**
 * Đổi khoảng đặt [startTime, endTime) thành dải ô [startSlot, endSlot) đã
 * clamp vào lưới. Trả về null nếu nằm hoàn toàn ngoài khung 05:00–24:00.
 */
export function rangeToSlots(
  startTime: string,
  endTime: string
): { startSlot: number; endSlot: number } | null {
  const start = toMinutes(startTime);
  let end = toMinutes(endTime);
  if (end <= start) end += 24 * 60; // qua nửa đêm
  const dayEnd = DAY_START_MIN + SLOT_COUNT * SLOT_MINUTES;
  const lo = Math.max(start, DAY_START_MIN);
  const hi = Math.min(end, dayEnd);
  if (hi <= lo) return null;
  return {
    startSlot: Math.floor((lo - DAY_START_MIN) / SLOT_MINUTES),
    endSlot: Math.ceil((hi - DAY_START_MIN) / SLOT_MINUTES),
  };
}
