/**
 * Ca làm việc của nhân viên (RBAC theo ca).
 *
 * Quy tắc nghiệp vụ: nhân viên chỉ được thực hiện action TRONG khung giờ ca của mình.
 * Logic kiểm tra ở backend GIỮ NGUYÊN như rule giờ hành chính cũ — chỉ đổi NGUỒN khung giờ
 * từ giờ cố định (BusinessHours) sang ca làm việc gắn với nhân viên.
 *
 * 3 ca:
 *  - S1: 08:00–17:00 (hành chính)
 *  - S2: 17:00–24:00 (tối)
 *  - S3: 00:00–08:00 (đêm)
 */
export interface WorkShift {
  value: string;
  label: string;
  start: string; // HH:mm
  end: string; // HH:mm, "24:00" = hết ngày
}

export const WORK_SHIFTS: WorkShift[] = [
  { value: "S1", label: "Ca 1 · 08:00–17:00", start: "08:00", end: "17:00" },
  { value: "S2", label: "Ca 2 · 17:00–24:00", start: "17:00", end: "24:00" },
  { value: "S3", label: "Ca 3 · 00:00–08:00", start: "00:00", end: "08:00" },
];

export const SHIFT_OPTIONS = WORK_SHIFTS.map((s) => ({
  value: s.value,
  label: s.label,
}));

export function shiftLabel(value: string): string {
  return WORK_SHIFTS.find((s) => s.value === value)?.label ?? value;
}

/** Màu badge cho từng ca — dùng cho lưới phân ca / chấm công. */
export const SHIFT_COLOR: Record<string, string> = {
  S1: "blue",
  S2: "grape",
  S3: "dark",
};
