import type { Payment, PaymentMethod, PaymentStatus, PaymentSource } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const atDay = (ago: number, h: number, m: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** PRNG có seed để khoản thu mock ổn định giữa các lần load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(424242);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const CUSTOMERS = [
  "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Minh Dũng",
  "Đỗ Thị Em", "Vũ Quốc Phong", "Khách lẻ",
];
const METHODS: PaymentMethod[] = ["cash", "qr", "ewallet", "card"];
const AMOUNTS = [120000, 240000, 260000, 300000, 360000, 500000, 35000, 90000];

function rollStatus(): PaymentStatus {
  const r = rand();
  if (r < 0.72) return "paid";
  if (r < 0.86) return "pending";
  if (r < 0.94) return "refunded";
  return "failed";
}

function generate(days: number): Payment[] {
  const out: Payment[] = [];
  let n = 1;
  let bk = 1006;
  let hd = 2010;
  for (let ago = 0; ago <= days; ago++) {
    const count = 2 + Math.floor(rand() * 5); // 2..6 khoản/ngày
    for (let i = 0; i < count; i++) {
      const source: PaymentSource = rand() < 0.6 ? "booking" : "order";
      const status = rollStatus();
      const hour = 8 + Math.floor(rand() * 14);
      const createdAt = atDay(ago, hour, Math.floor(rand() * 60));
      const refCode = source === "booking" ? `BK-${bk++}` : `HD-${hd++}`;
      out.push({
        id: `pt${n}`,
        code: `PT-${3000 + n}`,
        source,
        refId: `${source}-${n}`,
        refCode,
        customerName: pick(CUSTOMERS),
        amount: pick(AMOUNTS),
        method: pick(METHODS),
        status,
        createdAt,
        paidAt: status === "paid" ? createdAt : undefined,
      });
      n++;
    }
  }
  return out;
}

const seed: Payment[] = generate(14);

export const paymentService = createMockService(seed);

/** Tổng thực thu trong ngày (chỉ khoản đã `paid`). */
export function paidRevenueOn(payments: Payment[], isoDate: string): number {
  return payments
    .filter((p) => p.status === "paid" && (p.paidAt ?? p.createdAt).slice(0, 10) === isoDate)
    .reduce((sum, p) => sum + p.amount, 0);
}
