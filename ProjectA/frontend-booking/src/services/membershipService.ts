import type { MembershipLevel, MembershipPlan } from "../types/domain";
import { mockDelay } from "./mock/mockClient";

const plans: MembershipPlan[] = [
  { level: "basic", name: "Hạng Cơ bản", discountPercent: 0, benefits: ["Tích điểm mỗi lần chơi", "Nhận ưu đãi"] },
  { level: "silver", name: "Hạng Bạc", discountPercent: 5, benefits: ["Giảm 5% đặt sân", "Ưu tiên giờ vàng", "Tích điểm x1.2"] },
  { level: "gold", name: "Hạng Vàng", discountPercent: 10, benefits: ["Giảm 10% đặt sân", "Miễn phí thuê vợt 2 lần/tháng", "Tích điểm x1.5"] },
  { level: "platinum", name: "Hạng Bạch kim", discountPercent: 15, benefits: ["Giảm 15% mọi dịch vụ", "Giữ sân cố định", "Tích điểm x2", "Quà sinh nhật"] },
];

export const membershipService = {
  list: () => mockDelay([...plans]),
};

/** % giảm theo hạng (đồng bộ); dùng để tự giảm khi khách đăng nhập là thành viên. */
export function memberDiscountPercent(level: MembershipLevel): number {
  return plans.find((p) => p.level === level)?.discountPercent ?? 0;
}

export function membershipName(level: MembershipLevel): string {
  return plans.find((p) => p.level === level)?.name ?? level;
}
