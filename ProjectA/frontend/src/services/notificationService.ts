import type { AppNotification, AutomationRule } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const atDay = (ago: number, h: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const notifSeed: AppNotification[] = [
  { id: "n1", channel: "zalo", title: "Ưu đãi hè SUMMER10", audience: "Tất cả khách", message: "Giảm 10% mọi lượt đặt sân tới hết tháng.", status: "sent", recipients: 320, createdAt: atDay(1, 9), sentAt: atDay(1, 9) },
  { id: "n2", channel: "sms", title: "Nhắc lịch đặt sân", audience: "Khách đặt hôm nay", message: "Bạn có lịch đặt sân lúc 18:00 hôm nay.", status: "sent", recipients: 12, createdAt: atDay(0, 8), sentAt: atDay(0, 8) },
  { id: "n3", channel: "email", title: "Hóa đơn tháng", audience: "Khách VIP", message: "Bảng kê chi tiêu tháng này.", status: "scheduled", recipients: 45, createdAt: atDay(0, 7) },
  { id: "n4", channel: "push", title: "Sân trống giờ vàng", audience: "Khách quen", message: "Còn sân trống 19:00–21:00 tối nay.", status: "failed", recipients: 0, createdAt: atDay(2, 17) },
];

export const notificationService = createMockService(notifSeed);

const ruleSeed: AutomationRule[] = [
  { id: "ar1", trigger: "booking-reminder", name: "Nhắc lịch đặt sân", description: "Gửi trước giờ chơi 2 tiếng.", channel: "sms", enabled: true },
  { id: "ar2", trigger: "payment-reminder", name: "Nhắc thanh toán", description: "Nhắc khi có công nợ chưa thanh toán.", channel: "zalo", enabled: true },
  { id: "ar3", trigger: "promo-campaign", name: "Chiến dịch khuyến mãi", description: "Gửi khi có khuyến mãi mới kích hoạt.", channel: "email", enabled: false },
  { id: "ar4", trigger: "birthday", name: "Chúc mừng sinh nhật", description: "Tặng voucher vào ngày sinh nhật khách.", channel: "zalo", enabled: true },
];

export const automationService = createMockService(ruleSeed);
