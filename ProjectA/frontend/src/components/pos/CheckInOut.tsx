import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Group, SegmentedControl, Stack, Text, TextInput } from "@mantine/core";
import { IconLogin2, IconLogout2, IconSearch } from "@tabler/icons-react";
import { bookingService } from "../../services/bookingService";
import { STATUS_META } from "../bookings/bookingStatus";
import type { Booking, BookingStatus } from "../../types/domain";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);
type Filter = "all" | "todo" | "playing";

export function CheckInOut() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("todo");
  const [search, setSearch] = useState("");

  const load = () => bookingService.list().then(setBookings).catch((e) => notify.error(toMessage(e)));
  useEffect(() => { load(); }, []);

  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => b.date === todayIso)
      .filter((b) => {
        if (filter === "todo") return b.status === "pending" || b.status === "confirmed";
        if (filter === "playing") return b.status === "playing";
        return b.status !== "cancelled";
      })
      .filter((b) => !q || b.customerName.toLowerCase().includes(q) || b.customerPhone.includes(q) || b.courtName.toLowerCase().includes(q))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [bookings, filter, search]);

  const setStatus = async (b: Booking, status: BookingStatus, msg: string) => {
    const { id, ...rest } = b;
    try {
      await bookingService.update(id, { ...rest, status });
      notify.success(msg);
      load();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  return (
    <Stack>
      <Text fw={700} size="xl">Check-in / Check-out</Text>

      <Card withBorder p="sm">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            data={[
              { value: "todo", label: "Chờ vào sân" },
              { value: "playing", label: "Đang chơi" },
              { value: "all", label: "Tất cả hôm nay" },
            ]}
          />
          <TextInput
            placeholder="Tìm khách / SĐT / sân…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={260}
          />
        </Group>
      </Card>

      {view.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">Không có lượt nào.</Text>
      ) : (
        <Stack gap="xs">
          {view.map((b) => (
            <Card key={b.id} withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="md" wrap="nowrap">
                  <div style={{ minWidth: 64 }}>
                    <Text fw={700}>{b.startTime}</Text>
                    <Text size="xs" c="dimmed">{b.endTime}</Text>
                  </div>
                  <div>
                    <Text fw={500}>{b.customerName} · {b.courtName}</Text>
                    <Text size="xs" c="dimmed">{b.customerPhone}</Text>
                  </div>
                </Group>
                <Group gap="sm" wrap="nowrap">
                  <Badge variant="light" color={STATUS_META[b.status].color}>{STATUS_META[b.status].label}</Badge>
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <Button color="green" leftSection={<IconLogin2 size={16} />} onClick={() => setStatus(b, "playing", `${b.customerName} đã vào sân.`)}>
                      Check-in
                    </Button>
                  )}
                  {b.status === "playing" && (
                    <Button color="teal" leftSection={<IconLogout2 size={16} />} onClick={() => setStatus(b, "completed", `${b.customerName} đã trả sân.`)}>
                      Check-out
                    </Button>
                  )}
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
