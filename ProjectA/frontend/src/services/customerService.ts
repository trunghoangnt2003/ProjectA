import type { Customer } from "../types/domain";
import { createMockService } from "./mock/mockClient";

// SĐT khớp với khách trong bookingService để xem được lịch sử đặt sân.
const seed: Customer[] = [
  { id: "k1", name: "Nguyễn Văn An", phone: "0901234567", email: "an.nguyen@example.com", tags: ["vip", "frequent"], loyaltyPoints: 1250, debt: 0, locked: false, totalBookings: 42, joinedAt: "2024-03-12" },
  { id: "k2", name: "Trần Thị Bình", phone: "0912345678", tags: ["new"], loyaltyPoints: 80, debt: 0, locked: false, totalBookings: 8, joinedAt: "2025-01-05" },
  { id: "k3", name: "Lê Hoàng Cường", phone: "0923456789", email: "cuong.le@example.com", tags: ["frequent", "bad-debt"], loyaltyPoints: 430, debt: 150000, note: "Còn nợ tiền sân tuần trước, hẹn trả cuối tháng.", locked: false, totalBookings: 15, joinedAt: "2024-09-20" },
  { id: "k4", name: "Phạm Minh Dũng", phone: "0934567890", tags: ["vip", "frequent"], loyaltyPoints: 3400, debt: 0, locked: false, totalBookings: 67, joinedAt: "2023-11-02" },
  { id: "k5", name: "Đỗ Thị Em", phone: "0945678901", tags: ["new"], loyaltyPoints: 30, debt: 0, locked: true, note: "Tài khoản tạm khóa do nhiều lần no-show.", totalBookings: 3, joinedAt: "2025-04-18" },
];

export const customerService = createMockService(seed);
