import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Group, SimpleGrid, Stack, Text, Badge } from "@mantine/core";
import {
  IconPlayerPlay,
  IconClockHour4,
  IconLogin2,
  IconCash,
  IconReceipt,
  IconCalendarPlus,
  IconCashRegister,
  IconUserSearch,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { StatCard } from "../common";
import { bookingService } from "../../services/bookingService";
import { orderService, salesRevenueOn } from "../../services/orderService";
import { productService, PRODUCT_LOW_STOCK } from "../../services/productService";
import type { Booking, Order, Product } from "../../types/domain";
import { toMinutes } from "../../lib/time";
import { formatVnd } from "../../lib/format";

const todayIso = new Date().toISOString().slice(0, 10);
const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export function PosDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    bookingService.list().then(setBookings);
    orderService.list().then(setOrders);
    productService.list().then(setProducts);
  }, []);

  const m = useMemo(() => {
    const now = nowMin();
    const today = bookings.filter((b) => b.date === todayIso && b.status !== "cancelled" && b.status !== "no-show");
    const playing = today.filter((b) => b.status === "playing");
    const upcoming = today
      .filter((b) => (b.status === "pending" || b.status === "confirmed") && toMinutes(b.startTime) >= now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return {
      playingCourts: new Set(playing.map((b) => b.courtName)).size,
      checkedIn: playing.length,
      upcoming,
      ordersToday: orders.filter((o) => o.createdAt.slice(0, 10) === todayIso).length,
      revenueToday: salesRevenueOn(orders, todayIso),
    };
  }, [bookings, orders]);

  const lowStock = products.filter((p) => p.stock <= PRODUCT_LOW_STOCK);
  const soon = m.upcoming.filter((b) => toMinutes(b.startTime) - nowMin() <= 60);

  const actions = [
    { label: "Đặt nhanh", icon: <IconCalendarPlus size={22} />, to: "/pos/booking", color: "teal" },
    { label: "Bán hàng", icon: <IconCashRegister size={22} />, to: "/pos/sale", color: "blue" },
    { label: "Check-in / out", icon: <IconLogin2 size={22} />, to: "/pos/checkin", color: "grape" },
    { label: "Tra cứu khách", icon: <IconUserSearch size={22} />, to: "/pos/lookup", color: "orange" },
  ];

  return (
    <Stack>
      <Text fw={700} size="xl">Tổng quan ca</Text>

      <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
        <StatCard label="Sân đang chơi" value={m.playingCourts} icon={<IconPlayerPlay size={24} />} color="green" />
        <StatCard label="Khách đã check-in" value={m.checkedIn} icon={<IconLogin2 size={24} />} color="grape" />
        <StatCard label="Booking sắp tới" value={m.upcoming.length} icon={<IconClockHour4 size={24} />} color="orange" />
        <StatCard label="Đơn POS hôm nay" value={m.ordersToday} icon={<IconReceipt size={24} />} color="blue" />
        <StatCard label="Doanh thu bán hàng" value={formatVnd(m.revenueToday)} icon={<IconCash size={24} />} color="teal" />
      </SimpleGrid>

      {/* Quick actions — nút lớn touchscreen */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        {actions.map((a) => (
          <Button key={a.to} size="xl" h={72} variant="light" color={a.color} leftSection={a.icon} onClick={() => navigate(a.to)}>
            {a.label}
          </Button>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder>
          <Text fw={600} mb="sm">Booking sắp tới</Text>
          {m.upcoming.length === 0 ? (
            <Text size="sm" c="dimmed">Không có lượt nào sắp tới.</Text>
          ) : (
            <Stack gap="xs">
              {m.upcoming.slice(0, 6).map((b) => (
                <Group key={b.id} justify="space-between" wrap="nowrap">
                  <div>
                    <Text size="sm" fw={500}>{b.startTime} · {b.courtName}</Text>
                    <Text size="xs" c="dimmed">{b.customerName} · {b.customerPhone}</Text>
                  </div>
                  {toMinutes(b.startTime) - nowMin() <= 60 && (
                    <Badge color="orange" variant="light">Sắp tới giờ</Badge>
                  )}
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Stack>
          {soon.length > 0 && (
            <Alert color="orange" icon={<IconClockHour4 size={18} />} title="Sắp tới giờ chơi">
              {soon.length} lượt đặt bắt đầu trong 60 phút tới — chuẩn bị giao sân.
            </Alert>
          )}
          {lowStock.length > 0 && (
            <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Hàng sắp hết">
              {lowStock.map((p) => p.name).join(", ")} — cần nhập thêm.
            </Alert>
          )}
          {soon.length === 0 && lowStock.length === 0 && (
            <Alert color="teal">Mọi thứ ổn định. Không có cảnh báo.</Alert>
          )}
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
