import type { Court } from "../types/domain";
import { createMockService } from "./mock/mockClient";

// Khung giá phổ biến: sáng/trưa thấp điểm rẻ, tối (giờ vàng) đắt hơn, khuya trung bình.
const standardSlots = [
  { start: "05:00", end: "16:00", pricePerHour: 80000 },
  { start: "16:00", end: "22:00", pricePerHour: 130000 },
  { start: "22:00", end: "24:00", pricePerHour: 100000 },
];

const vipSlots = [
  { start: "05:00", end: "16:00", pricePerHour: 180000 },
  { start: "16:00", end: "22:00", pricePerHour: 250000 },
  { start: "22:00", end: "24:00", pricePerHour: 200000 },
];

const seed: Court[] = [
  { id: "c1", name: "Sân 1", zone: "Khu A", type: "standard", priceSlots: standardSlots, weekendSurcharge: 10, holidaySurcharge: 20, memberDiscount: 5, status: "available" },
  { id: "c2", name: "Sân 2", zone: "Khu A", type: "standard", priceSlots: standardSlots, weekendSurcharge: 10, holidaySurcharge: 20, memberDiscount: 5, status: "occupied" },
  { id: "c3", name: "Sân 3", zone: "Khu A", type: "standard", priceSlots: standardSlots, weekendSurcharge: 10, holidaySurcharge: 20, memberDiscount: 5, status: "available" },
  { id: "c4", name: "Sân 4", zone: "Khu B", type: "competition", priceSlots: standardSlots, weekendSurcharge: 15, holidaySurcharge: 25, memberDiscount: 5, status: "maintenance", note: "Thay lưới" },
  { id: "c5", name: "Sân 5", zone: "Khu B", type: "standard", priceSlots: standardSlots, weekendSurcharge: 10, holidaySurcharge: 20, memberDiscount: 5, status: "available" },
  { id: "c6", name: "Sân VIP", zone: "Khu VIP", type: "vip", priceSlots: vipSlots, weekendSurcharge: 15, holidaySurcharge: 30, memberDiscount: 10, status: "occupied" },
];

export const courtService = createMockService(seed);
