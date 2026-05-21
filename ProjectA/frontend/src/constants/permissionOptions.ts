/**
 * Danh sách quyền (mock) theo domain sân cầu lông.
 * Khi BE định nghĩa PermissionConstants thật, đồng bộ lại danh sách này.
 */
export const permissionOptions = [
  "court.view",
  "court.manage",
  "booking.view",
  "booking.manage",
  "customer.view",
  "customer.manage",
  "product.view",
  "product.manage",
  "supply.view",
  "supply.manage",
  "combo.manage", // quản lý combo dịch vụ
  "inventory.manage", // nhập/xuất kho
  "rental.manage", // cho thuê vợt/giày
  "sale.use", // dùng màn Bán hàng (POS)
  "order.view", // xem lịch sử bán hàng
  "payment.view", // xem thanh toán
  "payment.manage", // xác nhận thu/hoàn tiền
  "report.view", // xem báo cáo & phân tích
  "pos.use", // dùng chế độ POS (nhân viên trực quầy)
  "pos.cashier", // mở/đóng ca thu ngân
  "promotion.manage", // quản lý khuyến mãi
  "membership.manage", // quản lý gói thành viên
  "notification.manage", // gửi & tự động hóa thông báo
  "employee.manage",
  "roster.manage", // phân ca
  "attendance.manage", // chấm công
  "payroll.view", // bảng lương & KPI
  "user.manage",
  "role.manage",
];

/** Nhãn tiếng Việt dễ đọc cho từng quyền (hiển thị ở UI; key vẫn là nguồn chân lý). */
export const PERMISSION_LABELS: Record<string, string> = {
  "court.view": "Sân cầu · Xem",
  "court.manage": "Sân cầu · Quản lý",
  "booking.view": "Đặt sân · Xem",
  "booking.manage": "Đặt sân · Quản lý",
  "customer.view": "Khách hàng · Xem",
  "customer.manage": "Khách hàng · Quản lý",
  "product.view": "Hàng hóa · Xem",
  "product.manage": "Hàng hóa · Quản lý",
  "supply.view": "Vật tư · Xem",
  "supply.manage": "Vật tư · Quản lý",
  "combo.manage": "Combo dịch vụ · Quản lý",
  "inventory.manage": "Nhập/Xuất kho · Quản lý",
  "rental.manage": "Thuê đồ · Quản lý",
  "sale.use": "Bán hàng (POS)",
  "order.view": "Lịch sử bán hàng · Xem",
  "payment.view": "Thanh toán · Xem",
  "payment.manage": "Thanh toán · Quản lý",
  "report.view": "Báo cáo & Phân tích · Xem",
  "pos.use": "POS · Trực quầy",
  "pos.cashier": "POS · Ca thu ngân",
  "promotion.manage": "Khuyến mãi · Quản lý",
  "membership.manage": "Thành viên · Quản lý",
  "notification.manage": "Thông báo · Quản lý",
  "employee.manage": "Nhân viên · Quản lý",
  "roster.manage": "Phân ca · Quản lý",
  "attendance.manage": "Chấm công · Quản lý",
  "payroll.view": "Bảng lương & KPI · Xem",
  "user.manage": "Người dùng · Quản lý",
  "role.manage": "Phân quyền · Quản lý",
};

/** Nhãn dễ đọc của một quyền; fallback về chính key nếu chưa khai báo. */
export function permissionLabel(key: string): string {
  return PERMISSION_LABELS[key] ?? key;
}

/** Lựa chọn cho Select: value = key, label = nhãn dễ đọc. */
export const permissionSelectData = permissionOptions.map((p) => ({
  value: p,
  label: permissionLabel(p),
}));
