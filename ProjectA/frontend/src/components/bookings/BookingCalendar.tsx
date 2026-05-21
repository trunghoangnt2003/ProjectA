import { useMemo } from "react";
import { Box, Group, Text } from "@mantine/core";
import type { Booking, BookingStatus, Court } from "../../types/domain";
import { ALL_SLOTS, rangeToSlots, slotStart } from "../../lib/time";
import { formatVnd } from "../../lib/format";
import { STATUS_META, OCCUPYING_STATUSES } from "./bookingStatus";

/** Màu nền ô theo trạng thái (suy ra từ meta chung). */
const slotColor = (status: BookingStatus) =>
  `var(--mantine-color-${STATUS_META[status].color}-5)`;

interface BookingCalendarProps {
  courts: Court[];
  /** Các lượt đặt của đúng ngày đang xem. */
  bookings: Booking[];
  /** Có truyền => bấm vào ô đã đặt sẽ gọi để mở chi tiết. */
  onSelectBooking?: (booking: Booking) => void;
}

const LABEL_W = 110;
const CELL_W = 38;
const ROW_H = 36;

/**
 * Lịch sân chỉ-xem: trục dọc là sân, trục ngang là khung giờ trong ngày.
 * Cho admin nhìn nhanh độ phủ (sân nào, giờ nào đã kín) thay vì đọc bảng.
 * Lượt "đã hủy" không chiếm chỗ nên bỏ qua khi dựng lưới.
 */
export function BookingCalendar({
  courts,
  bookings,
  onSelectBooking,
}: BookingCalendarProps) {
  // courtName -> (slot -> booking phủ ô đó)
  const bookedByCourt = useMemo(() => {
    const map: Record<string, Map<number, Booking>> = {};
    for (const b of bookings) {
      if (!OCCUPYING_STATUSES.includes(b.status)) continue;
      const range = rangeToSlots(b.startTime, b.endTime);
      if (!range) continue;
      const slots = (map[b.courtName] ??= new Map());
      for (let s = range.startSlot; s < range.endSlot; s++) slots.set(s, b);
    }
    return map;
  }, [bookings]);

  return (
    <Box
      style={{
        userSelect: "none",
        overflow: "auto",
        maxHeight: "65vh",
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: "var(--mantine-radius-md)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${LABEL_W}px repeat(${ALL_SLOTS.length}, ${CELL_W}px)`,
          width: LABEL_W + ALL_SLOTS.length * CELL_W,
        }}
      >
        <div style={corner}>
          <Text size="11px" c="dimmed" fw={600}>
            Sân \ Giờ
          </Text>
        </div>
        {ALL_SLOTS.map((slot) => (
          <div key={slot} style={timeHeader}>
            <Text size="10px" c="dimmed">
              {slotStart(slot)}
            </Text>
          </div>
        ))}

        {courts.map((court) => (
          <Row
            key={court.id}
            court={court}
            slots={bookedByCourt[court.name]}
            onSelectBooking={onSelectBooking}
          />
        ))}
      </div>
    </Box>
  );
}

function Row({
  court,
  slots,
  onSelectBooking,
}: {
  court: Court;
  slots: Map<number, Booking> | undefined;
  onSelectBooking?: (booking: Booking) => void;
}) {
  return (
    <>
      <div style={courtLabel}>
        <Text size="sm" fw={600} truncate>
          {court.name}
        </Text>
        <Text size="9px" c="dimmed">
          {court.zone}
        </Text>
      </div>
      {ALL_SLOTS.map((slot) => {
        const b = slots?.get(slot);
        const clickable = b && onSelectBooking;
        return (
          <div
            key={slot}
            onClick={() => clickable && onSelectBooking(b)}
            style={{
              height: ROW_H,
              borderTop: "1px solid var(--mantine-color-gray-2)",
              borderLeft: "1px solid var(--mantine-color-gray-2)",
              background: b ? slotColor(b.status) : "white",
              cursor: clickable ? "pointer" : "default",
            }}
            title={
              b
                ? `${court.name} · ${slotStart(slot)}\n${b.code} — ${b.customerName} · ${b.customerPhone}\n${b.startTime}–${b.endTime} · ${STATUS_META[b.status].label} · ${formatVnd(b.totalPrice)}`
                : `${court.name} · ${slotStart(slot)} · Trống`
            }
          />
        );
      })}
    </>
  );
}

/** Chú thích màu cho lịch sân. */
export function CalendarLegend() {
  return (
    <Group gap="md" wrap="wrap">
      <LegendItem color="white" border label="Trống" />
      {OCCUPYING_STATUSES.map((s) => (
        <LegendItem key={s} color={slotColor(s)} label={STATUS_META[s].label} />
      ))}
    </Group>
  );
}

function LegendItem({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <Group gap={6}>
      <Box
        w={16}
        h={16}
        style={{
          background: color,
          borderRadius: 4,
          border: border ? "1px solid var(--mantine-color-gray-3)" : "none",
        }}
      />
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  );
}

const corner: React.CSSProperties = {
  position: "sticky",
  left: 0,
  top: 0,
  zIndex: 3,
  width: LABEL_W,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--mantine-color-gray-1)",
  borderBottom: "1px solid var(--mantine-color-gray-3)",
};

const timeHeader: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--mantine-color-gray-0)",
  borderBottom: "1px solid var(--mantine-color-gray-3)",
  borderLeft: "1px solid var(--mantine-color-gray-2)",
};

const courtLabel: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 1,
  width: LABEL_W,
  height: ROW_H,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  paddingLeft: 8,
  background: "var(--mantine-color-gray-0)",
  borderTop: "1px solid var(--mantine-color-gray-2)",
};
