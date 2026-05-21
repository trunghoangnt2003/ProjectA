import type { Booking, BookingStatus } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const todayIso = isoOf(today);

/** PRNG có seed (mulberry32) — để dữ liệu mock ổn định giữa các lần load, biểu đồ không "nhảy". */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260521);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const CUSTOMERS = [
  { name: "Nguyễn Văn An", phone: "0901234567" },
  { name: "Trần Thị Bình", phone: "0912345678" },
  { name: "Lê Hoàng Cường", phone: "0923456789" },
  { name: "Phạm Minh Dũng", phone: "0934567890" },
  { name: "Đỗ Thị Em", phone: "0945678901" },
  { name: "Vũ Quốc Phong", phone: "0956789012" },
  { name: "Hoàng Thu Giang", phone: "0967890123" },
  { name: "Bùi Anh Hải", phone: "0978901234" },
];
const COURTS = ["Sân 1", "Sân 2", "Sân 3", "Sân 4", "Sân 5", "Sân VIP"];
// Giờ bắt đầu, lệch về khung tối (giờ vàng) để "peak hours" có hình.
const START_HOURS = [6, 7, 8, 16, 17, 18, 18, 19, 19, 20, 20, 21];

// Lượt đặt hôm nay (cố định) để màn lịch/đặt sân luôn có dữ liệu quen thuộc.
const todaySeed: Booking[] = [
  { id: "b1", code: "BK-1001", customerName: "Nguyễn Văn An", customerPhone: "0901234567", courtName: "Sân 2", date: todayIso, startTime: "18:00", endTime: "20:00", status: "playing", totalPrice: 240000 },
  { id: "b2", code: "BK-1002", customerName: "Trần Thị Bình", customerPhone: "0912345678", courtName: "Sân VIP", date: todayIso, startTime: "19:00", endTime: "21:00", status: "pending", totalPrice: 500000 },
  { id: "b3", code: "BK-1003", customerName: "Lê Hoàng Cường", customerPhone: "0923456789", courtName: "Sân 5", date: todayIso, startTime: "06:00", endTime: "08:00", status: "completed", totalPrice: 300000 },
  { id: "b4", code: "BK-1004", customerName: "Phạm Minh Dũng", customerPhone: "0934567890", courtName: "Sân 1", date: todayIso, startTime: "20:00", endTime: "21:00", status: "confirmed", totalPrice: 120000 },
  { id: "b5", code: "BK-1005", customerName: "Đỗ Thị Em", customerPhone: "0945678901", courtName: "Sân 3", date: todayIso, startTime: "17:00", endTime: "18:00", status: "cancelled", totalPrice: 120000 },
];

/** Sinh lượt đặt cho 1..days ngày trước để biểu đồ Reports có dữ liệu lịch sử. */
function generateHistory(days: number): Booking[] {
  const out: Booking[] = [];
  let n = 1006;
  for (let ago = 1; ago <= days; ago++) {
    const d = new Date(today);
    d.setDate(d.getDate() - ago);
    const date = isoOf(d);
    const count = 3 + Math.floor(rand() * 6); // 3..8 lượt/ngày
    for (let i = 0; i < count; i++) {
      const cust = pick(CUSTOMERS);
      const startH = pick(START_HOURS);
      const dur = 1 + Math.floor(rand() * 2); // 1..2 giờ
      const endH = Math.min(startH + dur, 24);
      const hours = endH - startH;
      const isVip = rand() < 0.18;
      const courtName = isVip ? "Sân VIP" : pick(COURTS);
      const pricePerHour = isVip ? 250000 : 120000;
      // Ngày càng cũ càng nhiều "completed"; gần đây có hủy/no-show nhẹ.
      const r = rand();
      const status: BookingStatus =
        r < 0.08 ? "cancelled" : "completed";
      out.push({
        id: `bh-${ago}-${i}`,
        code: `BK-${n++}`,
        customerName: cust.name,
        customerPhone: cust.phone,
        courtName,
        date,
        startTime: `${String(startH).padStart(2, "0")}:00`,
        endTime: `${String(endH).padStart(2, "0")}:00`,
        status,
        totalPrice: hours * pricePerHour,
      });
    }
  }
  return out;
}

const seed: Booking[] = [...todaySeed, ...generateHistory(14)];

export const bookingService = createMockService(seed);
