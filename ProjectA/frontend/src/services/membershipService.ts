import type { MembershipPlan } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const seed: MembershipPlan[] = [
  {
    id: "mb1", level: "basic", name: "Hạng Cơ bản", price: 0, durationDays: 0, discountPercent: 0,
    benefits: ["Tích điểm mỗi lần chơi", "Nhận thông báo ưu đãi"], active: true,
  },
  {
    id: "mb2", level: "silver", name: "Hạng Bạc", price: 300000, durationDays: 90, discountPercent: 5,
    benefits: ["Giảm 5% đặt sân", "Ưu tiên giữ sân giờ vàng", "Tích điểm x1.2"], active: true,
  },
  {
    id: "mb3", level: "gold", name: "Hạng Vàng", price: 700000, durationDays: 180, discountPercent: 10,
    benefits: ["Giảm 10% đặt sân", "Miễn phí thuê vợt 2 lần/tháng", "Tích điểm x1.5"], active: true,
  },
  {
    id: "mb4", level: "platinum", name: "Hạng Bạch kim", price: 1500000, durationDays: 365, discountPercent: 15,
    benefits: ["Giảm 15% mọi dịch vụ", "Giữ sân cố định hàng tuần", "Tích điểm x2", "Quà sinh nhật"], active: true,
  },
];

export const membershipService = createMockService(seed);
