import type { Order, OrderLine } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const atDay = (ago: number, h: number, m: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** PRNG có seed để đơn hàng mock ổn định giữa các lần load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(7654321);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

// Mặt hàng mẫu (khớp productService / supplyService forSale).
const CATALOG: Omit<OrderLine, "quantity">[] = [
  { refId: "p1", source: "product", name: "Nước suối Aquafina 500ml", unitPrice: 10000 },
  { refId: "p3", source: "product", name: "Coca-Cola lon", unitPrice: 15000 },
  { refId: "p7", source: "product", name: "Mì ly Hảo Hảo", unitPrice: 15000 },
  { refId: "p8", source: "product", name: "Bánh mì trứng", unitPrice: 20000 },
  { refId: "s1", source: "supply", name: "Cầu lông Yonex AS-30", unitPrice: 320000 },
  { refId: "s3", source: "supply", name: "Cước đan vợt Yonex BG-65", unitPrice: 120000 },
  { refId: "s6", source: "supply", name: "Cuốn cán vợt", unitPrice: 25000 },
];
const CUSTOMERS = ["Khách lẻ", "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Vũ Quốc Phong"];
const COURTS = ["Sân 1", "Sân 2", "Sân 3", "Sân 5", "Sân VIP"];

function makeOrder(id: string, ago: number): Order {
  const lineCount = 1 + Math.floor(rand() * 3); // 1..3 dòng
  const lines: OrderLine[] = [];
  for (let i = 0; i < lineCount; i++) {
    const item = pick(CATALOG);
    lines.push({ ...item, quantity: 1 + Math.floor(rand() * 3) });
  }
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const hour = 8 + Math.floor(rand() * 14); // 08..21h
  return {
    id,
    code: `HD-${2000 + Number(id.replace(/\D/g, ""))}`,
    createdAt: atDay(ago, hour, Math.floor(rand() * 60)),
    customerName: pick(CUSTOMERS),
    courtName: rand() < 0.7 ? pick(COURTS) : undefined,
    lines,
    total,
  };
}

function generate(days: number): Order[] {
  const out: Order[] = [];
  let n = 1;
  for (let ago = 0; ago <= days; ago++) {
    const count = 2 + Math.floor(rand() * 5); // 2..6 đơn/ngày
    for (let i = 0; i < count; i++) out.push(makeOrder(`o${n++}`, ago));
  }
  return out;
}

const seed: Order[] = generate(14);

export const orderService = createMockService(seed);

/** Tổng doanh thu bán hàng trong ngày (yyyy-mm-dd). */
export function salesRevenueOn(orders: Order[], isoDate: string): number {
  return orders
    .filter((o) => o.createdAt.slice(0, 10) === isoDate)
    .reduce((sum, o) => sum + o.total, 0);
}
