import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Center, Loader, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { AppLayout } from "../components/layout/AppLayout";
import { NAV_GROUPS, NAV_TITLES, MODULE_PERMISSION } from "../config/navigation";
import { usePermissions } from "../hooks/usePermissions";

// Lazy-load từng trang để chia nhỏ bundle (chỉ tải khi mở module đó).
const named = <T extends object>(
  loader: () => Promise<Record<string, ComponentType>>,
  key: string
) => lazy(() => loader().then((m) => ({ default: m[key] as ComponentType<T> })));

const PAGES: Record<string, ComponentType> = {
  overview: named(() => import("./OverviewPage"), "OverviewPage"),
  reports: named(() => import("../components/reports/ReportsSection"), "ReportsSection"),
  courts: named(() => import("../components/courts/CourtSection"), "CourtSection"),
  bookings: named(() => import("../components/bookings/BookingSection"), "BookingSection"),
  schedule: named(() => import("../components/schedule/SchedulePage"), "SchedulePage"),
  customers: named(() => import("../components/customers/CustomerSection"), "CustomerSection"),
  sales: named(() => import("../components/sales/SaleSection"), "SaleSection"),
  orders: named(() => import("../components/orders/OrderHistorySection"), "OrderHistorySection"),
  payments: named(() => import("../components/payments/PaymentSection"), "PaymentSection"),
  products: named(() => import("../components/products/ProductSection"), "ProductSection"),
  supplies: named(() => import("../components/supplies/SupplySection"), "SupplySection"),
  combos: named(() => import("../components/combos/ComboSection"), "ComboSection"),
  inventory: named(() => import("../components/inventory/InventorySection"), "InventorySection"),
  rentals: named(() => import("../components/rentals/RentalSection"), "RentalSection"),
  promotions: named(() => import("../components/promotions/PromotionSection"), "PromotionSection"),
  memberships: named(() => import("../components/memberships/MembershipSection"), "MembershipSection"),
  notifications: named(() => import("../components/notifications/NotificationSection"), "NotificationSection"),
  users: named(() => import("../components/users/UserSection"), "UserSection"),
  roles: named(() => import("../components/roles/RoleSection"), "RoleSection"),
  employees: named(() => import("../components/employees/EmployeeSection"), "EmployeeSection"),
  roster: named(() => import("../components/workforce/RosterSection"), "RosterSection"),
  attendance: named(() => import("../components/workforce/AttendanceSection"), "AttendanceSection"),
  payroll: named(() => import("../components/workforce/PayrollSection"), "PayrollSection"),
};

interface DashboardPageProps {
  userEmail?: string;
  onLogout: () => void;
}

export function DashboardPage({ userEmail, onLogout }: DashboardPageProps) {
  const { can } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  // Module đang mở suy ra từ URL (vd "/courts" -> "courts").
  const activeKey = location.pathname.split("/")[1] || "overview";

  // Hiển thị toàn bộ menu (theo yêu cầu tạm thời)
  const visibleGroups = useMemo(
    () => NAV_GROUPS,
    []
  );

  return (
    <AppLayout
      navGroups={visibleGroups}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`/${key}`)}
      userEmail={userEmail}
      onLogout={onLogout}
      title={NAV_TITLES[activeKey] ?? "Tổng quan"}
    >
      <Suspense
        fallback={
          <Center mih="60vh">
            <Loader />
          </Center>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          {Object.entries(PAGES).map(([key, Page]) => (
            <Route
              key={key}
              path={`/${key}`}
              element={can(MODULE_PERMISSION[key]) ? <Page /> : <AccessDenied />}
            />
          ))}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

/** Hiển thị khi user mở module không có quyền (an toàn cả khi điều hướng trực tiếp). */
function AccessDenied() {
  return (
    <Stack align="center" justify="center" gap="sm" mih="60vh">
      <ThemeIcon size={56} radius="xl" variant="light" color="gray">
        <IconLock size={28} />
      </ThemeIcon>
      <Title order={4}>Không có quyền truy cập</Title>
      <Text c="dimmed" size="sm" ta="center" maw={420}>
        Bạn không được cấp quyền cho mục này. Liên hệ quản trị viên nếu cần truy cập.
      </Text>
    </Stack>
  );
}
