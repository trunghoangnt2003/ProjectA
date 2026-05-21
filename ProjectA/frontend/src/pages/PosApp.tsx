import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Center, Loader, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { PosLayout } from "../components/pos/PosLayout";
import { POS_NAV, POS_TITLES } from "../components/pos/posNav";
import { usePermissions } from "../hooks/usePermissions";

const named = (loader: () => Promise<Record<string, ComponentType>>, key: string) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

const PAGES: Record<string, ComponentType> = {
  dashboard: named(() => import("../components/pos/PosDashboard"), "PosDashboard"),
  courts: named(() => import("../components/pos/CourtLive"), "CourtLive"),
  booking: named(() => import("../components/pos/QuickBooking"), "QuickBooking"),
  sale: named(() => import("../components/sales/SaleSection"), "SaleSection"),
  checkin: named(() => import("../components/pos/CheckInOut"), "CheckInOut"),
  lookup: named(() => import("../components/pos/CustomerLookup"), "CustomerLookup"),
  cashier: named(() => import("../components/pos/CashierShiftScreen"), "CashierShiftScreen"),
  tasks: named(() => import("../components/pos/StaffTasks"), "StaffTasks"),
  devices: named(() => import("../components/pos/DeviceSettings"), "DeviceSettings"),
};

const POS_PERMISSION: Record<string, string | undefined> = Object.fromEntries(
  POS_NAV.map((i) => [i.key, i.permission])
);

interface PosAppProps {
  userEmail?: string;
}

export function PosApp({ userEmail }: PosAppProps) {
  const { can } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = location.pathname.split("/")[2] || "dashboard";
  const navItems = useMemo(() => POS_NAV.filter((i) => can(i.permission)), [can]);

  return (
    <PosLayout
      navItems={navItems}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`/pos/${key}`)}
      onExit={() => navigate("/overview")}
      userEmail={userEmail}
      title={POS_TITLES[activeKey] ?? "POS"}
    >
      <Suspense fallback={<Center mih="60vh"><Loader /></Center>}>
        <Routes>
          <Route path="/pos" element={<Navigate to="/pos/dashboard" replace />} />
          {Object.entries(PAGES).map(([key, Page]) => (
            <Route
              key={key}
              path={`/pos/${key}`}
              element={can(POS_PERMISSION[key]) ? <Page /> : <PosDenied />}
            />
          ))}
          <Route path="*" element={<Navigate to="/pos/dashboard" replace />} />
        </Routes>
      </Suspense>
    </PosLayout>
  );
}

function PosDenied() {
  return (
    <Stack align="center" justify="center" gap="sm" mih="60vh">
      <ThemeIcon size={56} radius="xl" variant="light" color="gray"><IconLock size={28} /></ThemeIcon>
      <Title order={4}>Không có quyền</Title>
      <Text c="dimmed" size="sm">Tài khoản của bạn không được cấp quyền cho mục POS này.</Text>
    </Stack>
  );
}
