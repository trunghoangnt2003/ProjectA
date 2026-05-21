import type { ShiftAssignment } from "../types/domain";
import { createMockService } from "./mock/mockClient";

/** Thứ Hai của tuần chứa ngày `base`. */
export function mondayOf(base = new Date()): Date {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7; // 0 = thứ Hai
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
const isoOf = (d: Date) => d.toISOString().slice(0, 10);

/** 7 ngày của tuần (thứ Hai → Chủ nhật). */
export function weekDays(base = new Date()): string[] {
  const mon = mondayOf(base);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(d.getDate() + i);
    return isoOf(d);
  });
}

// Nhân viên active + ca mặc định (khớp employeeService).
const ROSTER_EMP = [
  { id: "e1", name: "Hoàng Văn Phúc", shift: "S1" },
  { id: "e2", name: "Ngô Thị Hà", shift: "S1" },
  { id: "e3", name: "Vũ Đình Khoa", shift: "S2" },
  { id: "e4", name: "Bùi Thị Lan", shift: "S2" },
];

// Phân ca tuần hiện tại: mỗi nhân viên làm ca mặc định từ thứ Hai → thứ Bảy (nghỉ Chủ nhật).
function generate(): ShiftAssignment[] {
  const days = weekDays();
  const out: ShiftAssignment[] = [];
  let n = 1;
  days.slice(0, 6).forEach((date) => {
    ROSTER_EMP.forEach((e) => {
      out.push({ id: `ra${n++}`, employeeId: e.id, employeeName: e.name, date, shift: e.shift });
    });
  });
  return out;
}

export const rosterService = createMockService(generate());
