/** Lưới thời gian: 30 phút/ô, 05:00–24:00. */

export const DAY_START_MIN = 5 * 60; // 05:00
export const SLOT_MINUTES = 30;
export const SLOT_COUNT = ((24 - 5) * 60) / SLOT_MINUTES; // 38 ô

function minutesToHHmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Giờ bắt đầu của ô (gồm). */
export function slotStart(i: number): string {
  return minutesToHHmm(DAY_START_MIN + i * SLOT_MINUTES);
}

/** Giờ kết thúc của ô. Ô cuối -> "24:00". */
export function slotEnd(i: number): string {
  return minutesToHHmm(DAY_START_MIN + (i + 1) * SLOT_MINUTES);
}

/** Nhãn hiển thị mốc giờ bên trái lưới. */
export function slotLabel(i: number): string {
  return slotStart(i);
}

/** Số giờ của một dải [startSlot, endSlot). */
export function slotsToHours(startSlot: number, endSlot: number): number {
  return ((endSlot - startSlot) * SLOT_MINUTES) / 60;
}

export const ALL_SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i);
