/** Kiểu dữ liệu nghiệp vụ quản lý sân cầu lông (dùng cho mock, BE sẽ khớp sau). */

// ---- Phase 1: Vận hành ----

export type CourtStatus = "available" | "occupied" | "maintenance";

/** Khung giá theo giờ trong ngày. end="24:00" = hết ngày. */
export interface PriceSlot {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  pricePerHour: number;
}

/** Loại sân. */
export type CourtType = "standard" | "vip" | "competition";

export interface Court {
  id: string;
  name: string;
  zone: string; // khu vực: "Khu A", "Khu B"...
  type: CourtType; // loại sân
  imageUrl?: string; // ảnh sân (mock URL)
  priceSlots: PriceSlot[]; // giá theo khung giờ (bao gồm giờ cao điểm)
  weekendSurcharge: number; // % phụ thu cuối tuần
  holidaySurcharge: number; // % phụ thu ngày lễ
  memberDiscount: number; // % giảm cho thành viên
  status: CourtStatus;
  note?: string;
}

export type BookingStatus =
  | "pending" // chờ xác nhận
  | "confirmed" // đã xác nhận
  | "playing" // đang chơi (đã check-in)
  | "completed" // hoàn thành (đã check-out)
  | "cancelled" // đã hủy
  | "no-show"; // khách không đến

export interface Booking {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string; // SĐT để gọi xác nhận — quan trọng với khách vãng lai
  courtName: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  totalPrice: number;
  cancelReason?: string; // lý do hủy (khi status = cancelled)
}

/** Nhãn phân loại khách hàng (CRM). */
export type CustomerTag = "vip" | "frequent" | "bad-debt" | "new";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: CustomerTag[];
  loyaltyPoints: number; // điểm tích lũy
  debt: number; // công nợ (₫)
  note?: string; // ghi chú nội bộ
  locked: boolean; // khóa tài khoản
  totalBookings: number;
  joinedAt: string; // ISO
}

// ---- Phase 2: Kho & Dịch vụ ----

/** Hàng hóa bán cho khách: đồ uống, đồ ăn... (trước đây gọi là "Thức uống"). */
export interface Product {
  id: string;
  name: string;
  category: string; // "Nước suối", "Nước ngọt", "Đồ ăn", "Bia", "Tăng lực"...
  price: number; // giá bán
  stock: number; // tồn kho
}

export interface Supply {
  id: string;
  name: string;
  category: string; // "Cầu", "Vợt", "Lưới", "Giày"...
  quantity: number;
  unit: string; // "ống", "cây", "cái"...
  reorderLevel: number; // ngưỡng cảnh báo nhập thêm
  /** true = vật tư bán (bán cho khách, có giá); false = vật tư sân (phục vụ sân, không bán). */
  forSale: boolean;
  salePrice?: number; // giá bán — chỉ áp dụng khi forSale = true
  /** Giá thuê (₫/lượt) — chỉ vật tư sân cho thuê (Vợt/Giày). Tính vào doanh thu. */
  rentalPrice?: number;
  /** Giá trị món đồ (₫) — dùng tính cọc = 1/2 giá trị. Chỉ vật tư cho thuê. */
  rentalValue?: number;
}

// ---- Combo dịch vụ ----

/** Nguồn của một mặt hàng kho: hàng hóa hoặc vật tư. */
export type StockItemSource = "product" | "supply";

export interface ComboLine {
  refId: string;
  source: StockItemSource;
  name: string;
  quantity: number;
}

/** Gói nhiều mặt hàng bán kèm với giá ưu đãi. */
export interface Combo {
  id: string;
  name: string;
  description?: string;
  lines: ComboLine[];
  price: number; // giá bán combo (đã ưu đãi)
  active: boolean; // có bán ở POS không
}

// ---- Kho: giao dịch nhập / xuất ----

export type StockMovementType = "in" | "out" | "adjust";

/** Một lần nhập/xuất/điều chỉnh kho — lưu vết thay vì chỉ sửa số tồn. */
export interface StockMovement {
  id: string;
  createdAt: string; // ISO datetime
  itemSource: StockItemSource;
  itemId: string;
  itemName: string;
  type: StockMovementType;
  quantity: number; // độ lớn thay đổi (>0)
  balanceAfter: number; // tồn sau giao dịch
  reason?: string;
}

// ---- Thuê đồ (vợt / giày) ----

export type RentalStatus = "borrowed" | "returned";

export interface Rental {
  id: string;
  code: string; // TH-xxxx
  itemId: string; // id vật tư cho thuê
  itemName: string;
  customerName: string;
  customerPhone?: string;
  quantity: number;
  fee: number; // tiền thuê (₫) — tính vào doanh thu
  deposit: number; // tiền đặt cọc (₫) = 1/2 giá trị món × số lượng, hoàn khi trả
  borrowedAt: string; // ISO datetime
  dueAt?: string; // hạn trả (ISO date)
  returnedAt?: string; // ISO datetime
  status: RentalStatus;
  note?: string;
}

// ---- Khuyến mãi ----

export type PromotionType = "percentage" | "fixed" | "free-service" | "cashback";

export interface Promotion {
  id: string;
  code: string; // mã voucher/discount, vd "SUMMER10"
  name: string;
  type: PromotionType;
  value: number; // % (percentage) hoặc ₫ (fixed/cashback); free-service = 0
  description?: string;
  startDate?: string; // ISO date — hiệu lực từ
  endDate?: string; // ISO date — hết hạn
  timeStart?: string; // HH:mm — khung giờ áp dụng (happy hours)
  timeEnd?: string; // HH:mm
  minOrder?: number; // giá trị đơn tối thiểu
  maxUses?: number; // giới hạn lượt dùng
  usedCount: number;
  active: boolean;
}

// ---- Thành viên ----

export type MembershipLevel = "basic" | "silver" | "gold" | "platinum";

/** Gói thành viên — giá, hạn dùng (số ngày), quyền lợi & ưu đãi. */
export interface MembershipPlan {
  id: string;
  level: MembershipLevel;
  name: string;
  price: number; // giá gói (₫)
  durationDays: number; // hạn dùng → quản lý hết hạn
  discountPercent: number; // % giảm cho thành viên
  benefits: string[]; // quyền lợi
  active: boolean;
}

// ---- Thông báo ----

export type NotificationChannel = "email" | "sms" | "push" | "zalo";
export type NotificationStatus = "sent" | "scheduled" | "failed";

export interface AppNotification {
  id: string;
  channel: NotificationChannel;
  title: string;
  audience: string; // đối tượng nhận, vd "Tất cả khách", "Khách VIP"
  message: string;
  status: NotificationStatus;
  recipients: number; // số người nhận (ước tính)
  createdAt: string; // ISO datetime
  sentAt?: string;
}

export type AutomationTrigger =
  | "booking-reminder"
  | "payment-reminder"
  | "promo-campaign"
  | "birthday";

/** Quy tắc gửi thông báo tự động. */
export interface AutomationRule {
  id: string;
  trigger: AutomationTrigger;
  name: string;
  description: string;
  channel: NotificationChannel;
  enabled: boolean;
}

// ---- POS: ca thu ngân & công việc nhân viên ----

export type CashierShiftStatus = "open" | "closed";

/** Ca thu ngân: mở ca với tiền đầu ca, đóng ca kiểm kê tiền mặt. */
export interface CashierShift {
  id: string;
  cashier: string; // tên thu ngân
  openedAt: string; // ISO datetime
  closedAt?: string;
  openingCash: number; // tiền đầu ca
  countedCash?: number; // tiền mặt kiểm kê khi đóng ca
  status: CashierShiftStatus;
  note?: string;
}

export type TaskStatus = "pending" | "in-progress" | "done";

export interface StaffTask {
  id: string;
  title: string;
  category: string; // "Vệ sinh sân", "Setup sân", "Khác"
  assignee?: string;
  status: TaskStatus;
  createdAt: string;
}

// ---- Bán hàng (POS) ----

/** Một dòng trong hóa đơn bán hàng. */
export interface OrderLine {
  refId: string; // id của Product / Supply / Combo / vật tư cho thuê nguồn
  source: "product" | "supply" | "combo" | "rental";
  name: string;
  unitPrice: number;
  quantity: number;
}

/** Hóa đơn bán hàng — trừ kho khi thanh toán và tính vào doanh thu. */
export interface Order {
  id: string;
  code: string;
  createdAt: string; // ISO datetime
  customerName?: string;
  courtName?: string; // gắn với sân nào (nếu khách đang chơi)
  lines: OrderLine[];
  total: number; // doanh thu (đồ bán + tiền thuê), KHÔNG gồm cọc
  deposit?: number; // cọc giữ cho món thuê — khách trả = total + deposit, hoàn khi trả
}

// ---- Thanh toán ----

export type PaymentMethod = "cash" | "qr" | "ewallet" | "card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
/** Khoản thu gắn với lượt đặt sân hay đơn bán hàng. */
export type PaymentSource = "booking" | "order";

export interface Payment {
  id: string;
  code: string; // PT-xxxx
  source: PaymentSource;
  refId: string; // id booking/order liên quan
  refCode: string; // mã hiển thị: BK-… / HD-…
  customerName?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string; // ISO datetime tạo khoản thu
  paidAt?: string; // thời điểm xác nhận đã thu
  note?: string; // ghi chú / lý do hoàn tiền
}

// ---- Phase 3: Quản trị ----

export type EmployeeStatus = "active" | "inactive";

export interface Employee {
  id: string;
  name: string;
  position: string; // "Lễ tân", "Phục vụ", "Quản lý", "Kỹ thuật"
  phone: string;
  shift: string; // value của WORK_SHIFTS: "S1" | "S2" | "S3" (ca mặc định)
  status: EmployeeStatus;
  joinedAt: string; // ISO
  shiftRate: number; // lương mỗi ca (₫) — dùng tính bảng lương
}

/** Phân ca: gán nhân viên vào 1 ca trong 1 ngày. */
export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // ISO yyyy-mm-dd
  shift: string; // "S1" | "S2" | "S3"
}

export type AttendanceStatus = "present" | "late" | "absent";

/** Chấm công một ca làm của nhân viên. */
export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // ISO yyyy-mm-dd
  shift: string;
  status: AttendanceStatus;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
}
