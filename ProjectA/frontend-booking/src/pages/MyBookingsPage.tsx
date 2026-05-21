import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendarOff, IconLogin2 } from "@tabler/icons-react";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { bookingService } from "../services/bookingService";
import { courtService } from "../services/courtService";
import type { Booking, ConfirmStatus, Court } from "../types/domain";
import { slotStart, slotEnd } from "../lib/time";
import { formatVnd, formatDateVi } from "../lib/format";
import { notify } from "../lib/notify";

const STATUS: Record<ConfirmStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "yellow" },
  confirmed: { label: "Đã xác nhận", color: "teal" },
  cancelled: { label: "Đã hủy", color: "red" },
};
const todayIso = new Date().toISOString().slice(0, 10);

export function MyBookingsPage({ onGoAccount }: { onGoAccount?: () => void }) {
  const { customer } = useCustomerAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  const courtName = useMemo(() => {
    const m = new Map(courts.map((c) => [c.id, c.name]));
    return (id: string) => m.get(id) ?? id;
  }, [courts]);

  const reload = useCallback(() => {
    if (!customer) return;
    bookingService.listByPhone(customer.phone).then(setBookings);
  }, [customer]);

  useEffect(() => {
    courtService.list().then(setCourts);
  }, []);
  useEffect(reload, [reload]);

  const cancel = async (b: Booking) => {
    await bookingService.cancel(b.id);
    notify.success(`Đã hủy lượt ${b.code}.`);
    reload();
  };

  if (!customer) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder ta="center" py="xl">
          <Text c="dimmed" mb="md">Đăng nhập để xem lượt đặt của bạn.</Text>
          <Button leftSection={<IconLogin2 size={16} />} onClick={onGoAccount} color="accent">
            Đăng nhập
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" py="lg">
      <Title order={3} mb="md">Lượt đặt của tôi</Title>
      {bookings.length === 0 ? (
        <Card withBorder ta="center" py="xl">
          <IconCalendarOff size={32} color="var(--mantine-color-gray-5)" />
          <Text c="dimmed" mt="sm">Bạn chưa có lượt đặt nào.</Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {bookings.map((b) => {
            const canCancel = b.status !== "cancelled" && b.date >= todayIso;
            return (
              <Card key={b.id} withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Group gap="xs">
                      <Text fw={600}>{courtName(b.courtId)}</Text>
                      <Badge variant="light" color={STATUS[b.status].color}>{STATUS[b.status].label}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {formatDateVi(b.date)} · {slotStart(b.startSlot)}–{slotEnd(b.endSlot - 1)}
                    </Text>
                    <Text size="xs" c="dimmed">Mã: {b.code}{b.extras?.length ? ` · ${b.extras.length} dịch vụ kèm` : ""}</Text>
                  </div>
                  <Stack gap={6} align="flex-end">
                    <Text fw={600}>{formatVnd(b.totalPrice)}</Text>
                    {canCancel && (
                      <Button size="xs" variant="light" color="red" onClick={() => cancel(b)}>
                        Hủy lượt
                      </Button>
                    )}
                  </Stack>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
