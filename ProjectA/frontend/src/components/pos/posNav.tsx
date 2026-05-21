import type { ReactNode } from "react";
import {
  IconLayoutDashboard,
  IconLivePhoto,
  IconCalendarPlus,
  IconCashRegister,
  IconLogin2,
  IconUserSearch,
  IconReportMoney,
  IconChecklist,
  IconDeviceDesktop,
} from "@tabler/icons-react";

export interface PosNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  permission?: string;
}

/** Mục điều hướng trong chế độ POS (path = /pos/<key>). */
export const POS_NAV: PosNavItem[] = [
  { key: "dashboard", label: "Tổng quan ca", icon: <IconLayoutDashboard size={22} />, permission: "pos.use" },
  { key: "courts", label: "Sân (Live)", icon: <IconLivePhoto size={22} />, permission: "pos.use" },
  { key: "booking", label: "Đặt nhanh", icon: <IconCalendarPlus size={22} />, permission: "pos.use" },
  { key: "sale", label: "Bán hàng", icon: <IconCashRegister size={22} />, permission: "sale.use" },
  { key: "checkin", label: "Check-in / out", icon: <IconLogin2 size={22} />, permission: "pos.use" },
  { key: "lookup", label: "Tra cứu khách", icon: <IconUserSearch size={22} />, permission: "pos.use" },
  { key: "cashier", label: "Ca thu ngân", icon: <IconReportMoney size={22} />, permission: "pos.cashier" },
  { key: "tasks", label: "Công việc", icon: <IconChecklist size={22} />, permission: "pos.use" },
  { key: "devices", label: "Thiết bị", icon: <IconDeviceDesktop size={22} />, permission: "pos.cashier" },
];

export const POS_TITLES: Record<string, string> = Object.fromEntries(
  POS_NAV.map((i) => [i.key, i.label])
);
