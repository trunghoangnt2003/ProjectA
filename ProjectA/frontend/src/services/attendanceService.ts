import type { Attendance, AttendanceStatus } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const isoOf = (d: Date) => d.toISOString().slice(0, 10);

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(31337);

const EMP = [
  { id: "e1", name: "Hoàng Văn Phúc", shift: "S1", in: "07:55", out: "17:05" },
  { id: "e2", name: "Ngô Thị Hà", shift: "S1", in: "08:02", out: "17:00" },
  { id: "e3", name: "Vũ Đình Khoa", shift: "S2", in: "17:00", out: "24:00" },
  { id: "e4", name: "Bùi Thị Lan", shift: "S2", in: "17:10", out: "23:55" },
];

// Chấm công 14 ngày gần nhất (bỏ Chủ nhật).
function generate(days: number): Attendance[] {
  const out: Attendance[] = [];
  let n = 1;
  for (let ago = days; ago >= 1; ago--) {
    const d = new Date();
    d.setDate(d.getDate() - ago);
    if (d.getDay() === 0) continue; // nghỉ Chủ nhật
    const date = isoOf(d);
    for (const e of EMP) {
      const r = rand();
      const status: AttendanceStatus = r < 0.82 ? "present" : r < 0.93 ? "late" : "absent";
      out.push({
        id: `at${n++}`,
        employeeId: e.id,
        employeeName: e.name,
        date,
        shift: e.shift,
        status,
        checkIn: status === "absent" ? undefined : status === "late" ? "08:20" : e.in,
        checkOut: status === "absent" ? undefined : e.out,
      });
    }
  }
  return out;
}

export const attendanceService = createMockService(generate(14));
