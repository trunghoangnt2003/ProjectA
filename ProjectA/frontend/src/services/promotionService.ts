import type { Promotion } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const iso = (ago: number) => {
  const d = new Date();
  d.setDate(d.getDate() + ago);
  return d.toISOString().slice(0, 10);
};

const seed: Promotion[] = [
  { id: "pm1", code: "SUMMER10", name: "Giảm 10% mùa hè", type: "percentage", value: 10, description: "Áp dụng cho mọi lượt đặt sân.", startDate: iso(-7), endDate: iso(14), minOrder: 200000, maxUses: 200, usedCount: 47, active: true },
  { id: "pm2", code: "GIAM50K", name: "Giảm 50.000₫", type: "fixed", value: 50000, description: "Đơn từ 300.000₫.", startDate: iso(-3), endDate: iso(10), minOrder: 300000, maxUses: 100, usedCount: 12, active: true },
  { id: "pm3", code: "HAPPY18", name: "Happy Hours 17–19h", type: "percentage", value: 20, description: "Giảm 20% khung giờ vàng.", timeStart: "17:00", timeEnd: "19:00", usedCount: 88, active: true },
  { id: "pm4", code: "TANGNUOC", name: "Tặng nước suối", type: "free-service", value: 0, description: "Tặng 1 chai nước cho đơn từ 250k.", minOrder: 250000, usedCount: 30, active: true },
  { id: "pm5", code: "BACK20K", name: "Hoàn 20.000₫", type: "cashback", value: 20000, description: "Hoàn vào điểm tích lũy.", startDate: iso(-30), endDate: iso(-2), usedCount: 64, active: false },
];

export const promotionService = createMockService(seed);
