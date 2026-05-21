import { useEffect, useMemo, useState } from "react";
import { Anchor, Badge, Card, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconSearch, IconPhone } from "@tabler/icons-react";
import { customerService } from "../../services/customerService";
import { bookingService } from "../../services/bookingService";
import type { Booking, Customer, CustomerTag } from "../../types/domain";
import { formatVnd, formatDate } from "../../lib/format";

const TAG_META: Record<CustomerTag, { label: string; color: string }> = {
  vip: { label: "VIP", color: "yellow" },
  frequent: { label: "Khách quen", color: "blue" },
  "bad-debt": { label: "Công nợ xấu", color: "red" },
  new: { label: "Khách mới", color: "teal" },
};

export function CustomerLookup() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    customerService.list().then(setCustomers);
    bookingService.list().then(setBookings);
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s)).slice(0, 8);
  }, [customers, q]);

  const lastVisit = (phone: string) => {
    const bs = bookings.filter((b) => b.customerPhone === phone).sort((a, b) => b.date.localeCompare(a.date));
    return bs[0]?.date;
  };

  return (
    <Stack maw={640}>
      <Text fw={700} size="xl">Tra cứu khách</Text>
      <TextInput
        size="lg"
        placeholder="Nhập tên hoặc số điện thoại…"
        leftSection={<IconSearch size={18} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        autoFocus
      />

      {q.trim() === "" ? (
        <Text c="dimmed">Nhập từ khóa để tìm khách hàng.</Text>
      ) : results.length === 0 ? (
        <Text c="dimmed">Không tìm thấy khách phù hợp.</Text>
      ) : (
        <Stack gap="sm">
          {results.map((c) => (
            <Card key={c.id} withBorder>
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Group gap="xs">
                    <Text fw={600}>{c.name}</Text>
                    {c.tags.map((t) => (
                      <Badge key={t} size="xs" variant="light" color={TAG_META[t].color}>{TAG_META[t].label}</Badge>
                    ))}
                    {c.locked && <Badge size="xs" color="red">Khóa</Badge>}
                  </Group>
                  <Anchor href={`tel:${c.phone}`} size="sm">
                    <Group gap={4}><IconPhone size={13} />{c.phone}</Group>
                  </Anchor>
                </div>
                <Group gap="lg" wrap="nowrap">
                  <Stat label="Điểm" value={c.loyaltyPoints.toLocaleString("vi-VN")} />
                  <Stat label="Công nợ" value={c.debt > 0 ? formatVnd(c.debt) : "—"} danger={c.debt > 0} />
                  <Stat label="Lượt đặt" value={String(c.totalBookings)} />
                  <Stat label="Gần nhất" value={lastVisit(c.phone) ? formatDate(lastVisit(c.phone)!) : "—"} />
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div style={{ textAlign: "right" }}>
      <Text size="10px" c="dimmed">{label}</Text>
      <Text size="sm" fw={600} c={danger ? "red" : undefined}>{value}</Text>
    </div>
  );
}
