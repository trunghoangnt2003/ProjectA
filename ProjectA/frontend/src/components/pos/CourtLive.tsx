import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconPlayerStop, IconClockPlus, IconRefresh } from "@tabler/icons-react";
import { bookingService } from "../../services/bookingService";
import { courtService } from "../../services/courtService";
import type { Booking, Court } from "../../types/domain";
import { toMinutes } from "../../lib/time";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);
const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

type LiveState = "free" | "playing" | "ending" | "maintenance";
const STATE_META: Record<LiveState, { label: string; color: string }> = {
  free: { label: "Trống", color: "teal" },
  playing: { label: "Đang chơi", color: "blue" },
  ending: { label: "Sắp hết giờ", color: "orange" },
  maintenance: { label: "Bảo trì", color: "gray" },
};

export function CourtLive() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = () => {
    courtService.list().then(setCourts);
    bookingService.list().then(setBookings);
  };
  useEffect(load, []);

  const cells = useMemo(() => {
    const now = nowMin();
    return courts.map((court) => {
      const active = bookings.find(
        (b) =>
          b.courtName === court.name &&
          b.date === todayIso &&
          (b.status === "playing" || b.status === "confirmed") &&
          toMinutes(b.startTime) <= now &&
          now < toMinutes(b.endTime)
      );
      let state: LiveState = "free";
      if (court.status === "maintenance") state = "maintenance";
      else if (active) state = toMinutes(active.endTime) - now <= 30 ? "ending" : "playing";
      return { court, active, state };
    });
  }, [courts, bookings]);

  const endMatch = async (b: Booking) => {
    const { id, ...rest } = b;
    try {
      await bookingService.update(id, { ...rest, status: "completed" });
      notify.success(`Đã kết thúc trận ở ${b.courtName}.`);
      load();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const extend = async (b: Booking) => {
    const { id, ...rest } = b;
    try {
      await bookingService.update(id, { ...rest, endTime: hhmm(toMinutes(b.endTime) + 30) });
      notify.success(`Đã gia hạn ${b.courtName} thêm 30 phút.`);
      load();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={700} size="xl">Trạng thái sân (Live)</Text>
        <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={load}>Làm mới</Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
        {cells.map(({ court, active, state }) => {
          const meta = STATE_META[state];
          return (
            <Card key={court.id} withBorder shadow="sm" style={{ borderTop: `4px solid var(--mantine-color-${meta.color}-6)` }}>
              <Group justify="space-between" mb={4}>
                <Text fw={700}>{court.name}</Text>
                <Badge color={meta.color} variant="light">{meta.label}</Badge>
              </Group>
              <Text size="xs" c="dimmed">{court.zone}</Text>

              {active ? (
                <Stack gap={4} mt="sm">
                  <Text size="sm" fw={500}>{active.customerName}</Text>
                  <Text size="xs" c="dimmed">{active.startTime}–{active.endTime} · {active.customerPhone}</Text>
                  <Group gap="xs" mt="xs">
                    <Button size="xs" variant="light" color="orange" leftSection={<IconClockPlus size={14} />} onClick={() => extend(active)}>
                      +30'
                    </Button>
                    <Button size="xs" variant="light" color="red" leftSection={<IconPlayerStop size={14} />} onClick={() => endMatch(active)}>
                      Kết thúc
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" mt="sm">
                  {state === "maintenance" ? court.note || "Đang bảo trì" : "Sẵn sàng cho thuê"}
                </Text>
              )}
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
