import {
  IconLayoutDashboard,
  IconChartBar,
  IconBuildingStadium,
  IconCalendarEvent,
  IconCalendarClock,
  IconUsers,
  IconId,
  IconShoppingBag,
  IconCashRegister,
  IconReceipt,
  IconCreditCard,
  IconPackages,
  IconBoxSeam,
  IconGift,
  IconArrowsExchange,
  IconDiscount2,
  IconCrown,
  IconBellRinging,
  IconUserCog,
  IconShieldLock,
  IconCalendarTime,
  IconChecklist,
  IconCoin,
} from "@tabler/icons-react";
import type { NavGroup } from "../components/layout/AppLayout";

/**
 * Cấu trúc navigation theo domain quản lý sân cầu lông.
 * `disabled: true` = module chưa có API back-end (hiện nhãn "Sắp có").
 * `permission` = quyền tối thiểu để thấy & mở module (gating menu + màn hình).
 * Khi thêm module mới: tạo section component, thêm case render trong DashboardPage.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        key: "overview",
        label: "Tổng quan",
        icon: <IconLayoutDashboard size={20} />,
        // Tổng quan: ai đăng nhập cũng xem được.
      },
      {
        key: "reports",
        label: "Báo cáo & Phân tích",
        icon: <IconChartBar size={20} />,
        permission: "report.view",
      },
    ],
  },
  {
    label: "Vận hành",
    items: [
      {
        key: "courts",
        label: "Sân cầu",
        icon: <IconBuildingStadium size={20} />,
        permission: "court.view",
      },
      {
        key: "bookings",
        label: "Đặt sân",
        icon: <IconCalendarEvent size={20} />,
        permission: "booking.view",
      },
      {
        key: "schedule",
        label: "Lịch hôm nay",
        icon: <IconCalendarClock size={20} />,
        permission: "booking.view",
      },
      {
        key: "customers",
        label: "Khách hàng",
        icon: <IconUsers size={20} />,
        permission: "customer.view",
      },
    ],
  },
  {
    label: "Kho & Dịch vụ",
    items: [
      {
        key: "sales",
        label: "Bán hàng",
        icon: <IconCashRegister size={20} />,
        permission: "sale.use",
      },
      {
        key: "orders",
        label: "Lịch sử bán hàng",
        icon: <IconReceipt size={20} />,
        permission: "order.view",
      },
      {
        key: "payments",
        label: "Thanh toán",
        icon: <IconCreditCard size={20} />,
        permission: "payment.view",
      },
      {
        key: "products",
        label: "Hàng hóa",
        icon: <IconShoppingBag size={20} />,
        permission: "product.view",
      },
      {
        key: "supplies",
        label: "Vật tư",
        icon: <IconPackages size={20} />,
        permission: "supply.view",
      },
      {
        key: "combos",
        label: "Combo dịch vụ",
        icon: <IconGift size={20} />,
        permission: "combo.manage",
      },
      {
        key: "inventory",
        label: "Nhập / Xuất kho",
        icon: <IconArrowsExchange size={20} />,
        permission: "inventory.manage",
      },
      {
        key: "rentals",
        label: "Thuê đồ",
        icon: <IconBoxSeam size={20} />,
        permission: "rental.manage",
      },
    ],
  },
  {
    label: "Khuyến mãi & Thành viên",
    items: [
      {
        key: "promotions",
        label: "Khuyến mãi",
        icon: <IconDiscount2 size={20} />,
        permission: "promotion.manage",
      },
      {
        key: "memberships",
        label: "Thành viên",
        icon: <IconCrown size={20} />,
        permission: "membership.manage",
      },
      {
        key: "notifications",
        label: "Thông báo",
        icon: <IconBellRinging size={20} />,
        permission: "notification.manage",
      },
    ],
  },
  {
    label: "Nhân sự",
    items: [
      {
        key: "employees",
        label: "Nhân viên",
        icon: <IconId size={20} />,
        permission: "employee.manage",
      },
      {
        key: "roster",
        label: "Phân ca",
        icon: <IconCalendarTime size={20} />,
        permission: "roster.manage",
      },
      {
        key: "attendance",
        label: "Chấm công",
        icon: <IconChecklist size={20} />,
        permission: "attendance.manage",
      },
      {
        key: "payroll",
        label: "Bảng lương & KPI",
        icon: <IconCoin size={20} />,
        permission: "payroll.view",
      },
    ],
  },
  {
    label: "Quản trị",
    items: [
      {
        key: "users",
        label: "Người dùng",
        icon: <IconUserCog size={20} />,
        permission: "user.manage",
      },
      {
        key: "roles",
        label: "Phân quyền",
        icon: <IconShieldLock size={20} />,
        permission: "role.manage",
      },
    ],
  },
];

/** Map key -> tiêu đề topbar. */
export const NAV_TITLES: Record<string, string> = {
  overview: "Tổng quan",
  reports: "Báo cáo & Phân tích",
  courts: "Sân cầu",
  bookings: "Đặt sân",
  schedule: "Lịch hôm nay",
  customers: "Khách hàng",
  sales: "Bán hàng",
  orders: "Lịch sử bán hàng",
  payments: "Thanh toán",
  products: "Hàng hóa",
  supplies: "Vật tư",
  combos: "Combo dịch vụ",
  inventory: "Nhập / Xuất kho",
  rentals: "Thuê đồ",
  promotions: "Khuyến mãi",
  memberships: "Thành viên",
  notifications: "Thông báo",
  roster: "Phân ca",
  attendance: "Chấm công",
  payroll: "Bảng lương & KPI",
  users: "Người dùng",
  roles: "Phân quyền",
  employees: "Nhân viên",
};

/** Map key -> quyền tối thiểu để mở màn hình (dùng để chặn cả khi điều hướng trực tiếp). */
export const MODULE_PERMISSION: Record<string, string | undefined> =
  Object.fromEntries(
    NAV_GROUPS.flatMap((g) => g.items).map((i) => [i.key, i.permission])
  );
