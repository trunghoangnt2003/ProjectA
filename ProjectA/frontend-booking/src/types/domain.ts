/** Kiểu dữ liệu cho trang đặt sân (đồng bộ với app admin). */

export interface PriceSlot {
  start: string; // "HH:mm"
  end: string; // "HH:mm", "24:00" = hết ngày
  pricePerHour: number;
}

export type CourtType = "standard" | "vip" | "competition";

export interface Court {
  id: string;
  name: string;
  zone: string;
  type: CourtType;
  imageUrl?: string;
  priceSlots: PriceSlot[];
  weekendSurcharge: number; // % phụ thu cuối tuần
  holidaySurcharge: number; // % phụ thu ngày lễ
  memberDiscount: number; // % giảm cho thành viên (dùng ở U-P2 khi đăng nhập)
}

/** Một mặt hàng/dịch vụ đặt kèm (đồ uống, đồ ăn, combo, thuê đồ). */
export interface ExtraItem {
  id: string;
  name: string;
  group: string; // "Đồ uống" | "Đồ ăn" | "Combo" | "Thuê đồ"
  price: number;
  unit?: string;
}

/** Dòng dịch vụ kèm trong đơn đặt. */
export interface BookingExtra {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = "cash" | "qr" | "ewallet" | "card";

/** Mã khuyến mãi áp khi đặt. */
export interface Voucher {
  code: string;
  label: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder?: number;
}

/** Trạng thái xác nhận (lưu trong dữ liệu). */
export type ConfirmStatus = "pending" | "confirmed" | "cancelled";

export type MembershipLevel = "basic" | "silver" | "gold" | "platinum";

/** Gói thành viên (mock — đồng bộ admin). */
export interface MembershipPlan {
  level: MembershipLevel;
  name: string;
  discountPercent: number;
  benefits: string[];
}

/** Tài khoản khách hàng (mock). */
export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  membershipLevel: MembershipLevel;
  joinedAt: string; // ISO yyyy-mm-dd
}

/** Một lượt đã đặt (chiếm dải slot trên 1 sân trong 1 ngày). */
export interface Booking {
  id: string;
  code: string; // mã tra cứu, vd "BK-4827"
  date: string; // ISO yyyy-mm-dd
  courtId: string;
  startSlot: number; // chỉ số slot bắt đầu (gồm)
  endSlot: number; // chỉ số slot kết thúc (KHÔNG gồm)
  customerName: string;
  phone: string;
  totalPrice: number;
  status: ConfirmStatus;
  // Order-level (đặt kèm dịch vụ + thanh toán) — tùy chọn.
  extras?: BookingExtra[];
  paymentMethod?: PaymentMethod;
  voucherCode?: string;
  discount?: number;
}

/** Vùng đang chọn trên lưới. */
export interface Selection {
  courtId: string;
  startSlot: number; // gồm
  endSlot: number; // KHÔNG gồm
}
