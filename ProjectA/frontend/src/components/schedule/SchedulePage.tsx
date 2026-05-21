import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPhone } from "@tabler/icons-react";
import { PageHeader } from "../common";
import { BookingCalendar, CalendarLegend } from "../bookings/BookingCalendar";
import { STATUS_META } from "../bookings/bookingStatus";
import { bookingService } from "../../services/bookingService";
import { courtService } from "../../services/courtService";
import type { Booking, Court } from "../../types/domain";
import { formatVnd, formatDate } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);

/**
 * Trang lịch trực cho nhân viên: xem ai đặt sân trong ngày, bấm vào ô để xem
 * nhanh tên + SĐT và gọi xác nhận với khách (đặc biệt khách vãng lai).
 */
export function SchedulePage() {
  const [date, setDate] = useState(todayIso);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    courtService.list().then(setCourts).catch((e) => notify.error(toMessage(e)));
  }, []);

  useEffect(() => {
    bookingService.list().then(setBookings).catch((e) => notify.error(toMessage(e)));
  }, []);

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.date === date),
    [bookings, date]
  );
  const activeCount = dayBookings.filter((b) => b.status !== "cancelled").length;

  return (
    <>
      <PageHeader
        title="Lịch hôm nay"
        subtitle="Lịch đặt sân trong ngày — bấm vào ô để xem khách và gọi xác nhận"
      />

      <Stack>
        <Card p="md">
          <Group align="flex-end" justify="space-between" gap="lg" wrap="wrap">
            <TextInput
              label="Chọn ngày"
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
            <Text size="sm" c="dimmed">
              {formatDate(date)} · {activeCount} lượt đặt
            </Text>
            <CalendarLegend />
          </Group>
        </Card>

        <BookingCalendar
          courts={courts}
          bookings={dayBookings}
          onSelectBooking={setSelected}
        />
        <Text size="xs" c="dimmed">
          Bấm vào ô đã đặt để xem chi tiết. Lượt đã hủy không hiển thị trên lịch.
        </Text>
      </Stack>

      <Modal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title="Chi tiết lượt đặt"
        centered
      >
        {selected && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={700} size="lg">
                {selected.code}
              </Text>
              <Badge variant="light" color={STATUS_META[selected.status].color}>
                {STATUS_META[selected.status].label}
              </Badge>
            </Group>

            <DetailRow label="Khách hàng" value={selected.customerName} />
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="dimmed">
                Số điện thoại
              </Text>
              <Anchor href={`tel:${selected.customerPhone}`} fw={600}>
                <Group gap={4} wrap="nowrap">
                  <IconPhone size={15} />
                  {selected.customerPhone}
                </Group>
              </Anchor>
            </Group>
            <DetailRow label="Sân" value={selected.courtName} />
            <DetailRow
              label="Thời gian"
              value={`${formatDate(selected.date)} · ${selected.startTime}–${selected.endTime}`}
            />
            <DetailRow label="Thành tiền" value={formatVnd(selected.totalPrice)} />

            <Group justify="flex-end" mt="sm">
              <Button
                component="a"
                href={`tel:${selected.customerPhone}`}
                leftSection={<IconPhone size={16} />}
              >
                Gọi khách
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500} ta="right">
        {value}
      </Text>
    </Group>
  );
}
