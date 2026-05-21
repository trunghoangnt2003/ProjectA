import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Group, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { IconBolt, IconCheck } from "@tabler/icons-react";
import { bookingService } from "../../services/bookingService";
import { courtService } from "../../services/courtService";
import type { Booking, Court } from "../../types/domain";
import { toMinutes } from "../../lib/time";
import { estimateBookingPrice } from "../../lib/pricing";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);
const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function QuickBooking() {
  const navigate = useNavigate();
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courtName, setCourtName] = useState<string | null>(null);
  const [start, setStart] = useState(hhmm(Math.ceil(nowMin() / 60) * 60));
  const [end, setEnd] = useState(hhmm(Math.ceil(nowMin() / 60) * 60 + 60));
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    courtService.list().then(setCourts);
    bookingService.list().then(setBookings);
  }, []);

  // Sân trống lúc này (không bảo trì, không có lượt phủ giờ hiện tại).
  const freeNow = useMemo(() => {
    const now = nowMin();
    return courts.filter(
      (c) =>
        c.status !== "maintenance" &&
        !bookings.some(
          (b) =>
            b.courtName === c.name && b.date === todayIso &&
            (b.status === "playing" || b.status === "confirmed") &&
            toMinutes(b.startTime) <= now && now < toMinutes(b.endTime)
        )
    );
  }, [courts, bookings]);

  const selectedCourt = courts.find((c) => c.name === courtName);
  const price = useMemo(
    () => (selectedCourt ? estimateBookingPrice(selectedCourt.priceSlots, start, end) : 0),
    [selectedCourt, start, end]
  );

  const submit = async () => {
    if (!courtName) return notify.error("Chọn sân.");
    if (!customerName.trim()) return notify.error("Nhập tên khách.");
    if (!/^0\d{9,10}$/.test(customerPhone.trim())) return notify.error("SĐT không hợp lệ.");
    if (toMinutes(end) <= toMinutes(start)) return notify.error("Giờ kết thúc phải sau giờ bắt đầu.");
    setSaving(true);
    try {
      await bookingService.create({
        code: "BK-" + Math.floor(1000 + Math.random() * 9000),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        courtName,
        date: todayIso,
        startTime: start,
        endTime: end,
        status: "confirmed",
        totalPrice: price,
      });
      notify.success(`Đã đặt ${courtName} ${start}–${end} · ${formatVnd(price)}.`);
      navigate("/pos/courts");
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack maw={620}>
      <Text fw={700} size="xl">Đặt nhanh tại quầy</Text>

      <Card withBorder>
        <Text size="sm" fw={600} mb="xs">Sân trống lúc này — chọn nhanh</Text>
        {freeNow.length === 0 ? (
          <Text size="sm" c="dimmed">Hiện không có sân trống.</Text>
        ) : (
          <Group gap="xs">
            {freeNow.map((c) => (
              <Button
                key={c.id}
                variant={courtName === c.name ? "filled" : "light"}
                color="teal"
                leftSection={<IconBolt size={14} />}
                onClick={() => setCourtName(c.name)}
              >
                {c.name}
              </Button>
            ))}
          </Group>
        )}
      </Card>

      <Card withBorder>
        <Stack>
          <Select
            label="Sân"
            required
            searchable
            data={courts.map((c) => c.name)}
            value={courtName}
            onChange={setCourtName}
          />
          <Group grow>
            <TextInput label="Giờ bắt đầu" type="time" value={start} onChange={(e) => setStart(e.currentTarget.value)} />
            <TextInput label="Giờ kết thúc" type="time" value={end} onChange={(e) => setEnd(e.currentTarget.value)} />
          </Group>
          <Group grow>
            <TextInput label="Tên khách (walk-in)" value={customerName} onChange={(e) => setCustomerName(e.currentTarget.value)} />
            <TextInput label="Số điện thoại" placeholder="0901234567" value={customerPhone} onChange={(e) => setCustomerPhone(e.currentTarget.value)} />
          </Group>

          <Group justify="space-between" mt="xs">
            <div>
              <Text size="xs" c="dimmed">Thành tiền (tự tính)</Text>
              <Text fw={700} size="lg" c="teal">{formatVnd(price)}</Text>
            </div>
            <Badge variant="light">{todayIso}</Badge>
          </Group>

          <Button size="lg" leftSection={<IconCheck size={18} />} onClick={submit} loading={saving}>
            Xác nhận đặt sân
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
