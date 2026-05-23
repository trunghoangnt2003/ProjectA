import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Container, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconBell, IconClockHour4, IconTag, IconGift } from "@tabler/icons-react";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { bookingService, setCourtMaps } from "../services/bookingService";
import { courtService } from "../services/courtService";
import type { Booking, Court } from "../types/domain";
import { slotStart } from "../lib/time";
import { formatDateVi } from "../lib/format";

const todayIso = new Date().toISOString().slice(0, 10);

// Thông báo khuyến mãi chung (mock).
const PROMOS = [
  { icon: <IconTag size={18} />, color: "blue", title: "SUMMER10 — giảm 10%", body: "Áp dụng cho đơn từ 200.000₫ đến hết tháng." },
  { icon: <IconGift size={18} />, color: "grape", title: "Giờ vàng HAPPY18", body: "Giảm 20% khung 17:00–19:00 các ngày trong tuần." },
];

export function NotificationsPage() {
  const { customer } = useCustomerAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    courtService.list().then((c) => {
      setCourts(c);
      setCourtMaps(c);
    });
    if (customer) bookingService.listByPhone(customer.phone).then(setBookings);
  }, [customer]);

  const courtName = useMemo(() => {
    const m = new Map(courts.map((c) => [c.id, c.name]));
    return (id: string) => m.get(id) ?? id;
  }, [courts]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled" && b.date >= todayIso)
        .sort((a, b) => (a.date === b.date ? a.startSlot - b.startSlot : a.date < b.date ? -1 : 1)),
    [bookings]
  );

  return (
    <Container size="sm" py="lg">
      <Group gap="xs" mb="md">
        <IconBell size={22} />
        <Title order={3}>Thông báo</Title>
      </Group>

      <Stack>
        <div>
          <Text fw={600} mb="xs">Nhắc lịch sắp tới</Text>
          {!customer ? (
            <Alert color="gray">Đăng nhập để nhận nhắc lịch đặt sân của bạn.</Alert>
          ) : upcoming.length === 0 ? (
            <Alert color="gray">Không có lịch sắp tới.</Alert>
          ) : (
            <Stack gap="xs">
              {upcoming.map((b) => (
                <Card key={b.id} withBorder>
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon variant="light" color="orange" radius="xl"><IconClockHour4 size={18} /></ThemeIcon>
                    <div>
                      <Text size="sm" fw={500}>{courtName(b.courtId)} · {slotStart(b.startSlot)}</Text>
                      <Text size="xs" c="dimmed">{formatDateVi(b.date)} · mã {b.code}</Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </div>

        <div>
          <Text fw={600} mb="xs">Ưu đãi</Text>
          <Stack gap="xs">
            {PROMOS.map((p) => (
              <Card key={p.title} withBorder>
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color={p.color} radius="xl">{p.icon}</ThemeIcon>
                  <div>
                    <Text size="sm" fw={500}>{p.title}</Text>
                    <Text size="xs" c="dimmed">{p.body}</Text>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
