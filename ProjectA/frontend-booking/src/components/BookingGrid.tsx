import { Box, Text } from "@mantine/core";
import type { Court } from "../types/domain";
import { ALL_SLOTS, slotStart } from "../lib/time";
import { keyOf } from "../lib/selection";

interface BookingGridProps {
  courts: Court[];
  /** courtId -> tập slot đã đặt. */
  bookedByCourt: Record<string, Set<number>>;
  selected: Set<string>;
  onToggle: (courtId: string, slot: number) => void;
}

const LABEL_W = 96;
const CELL_W = 40;
const ROW_H = 34;

export function BookingGrid({
  courts,
  bookedByCourt,
  selected,
  onToggle,
}: BookingGridProps) {
  const isBooked = (courtId: string, slot: number) =>
    bookedByCourt[courtId]?.has(slot) ?? false;

  return (
    <Box
      style={{
        userSelect: "none",
        overflow: "auto",
        maxHeight: "70vh",
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
        {/* Góc trên trái */}
        <div style={{ ...corner }}>
          <Text size="11px" c="dimmed" fw={600}>
            Sân \ Giờ
          </Text>
        </div>
        {/* Header giờ */}
        {ALL_SLOTS.map((slot) => (
          <div key={slot} style={timeHeader}>
            <Text size="10px" c="dimmed">
              {slotStart(slot)}
            </Text>
          </div>
        ))}

        {/* Mỗi sân = 1 hàng */}
        {courts.map((court) => (
          <Row
            key={court.id}
            court={court}
            isBooked={isBooked}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
      </div>
    </Box>
  );
}

function Row({
  court,
  isBooked,
  selected,
  onToggle,
}: {
  court: Court;
  isBooked: (c: string, s: number) => boolean;
  selected: Set<string>;
  onToggle: (c: string, s: number) => void;
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
        const booked = isBooked(court.id, slot);
        const isSel = selected.has(keyOf(court.id, slot));
        return (
          <div
            key={slot}
            onClick={() => !booked && onToggle(court.id, slot)}
            style={{
              height: ROW_H,
              borderTop: "1px solid var(--mantine-color-gray-2)",
              borderLeft: "1px solid var(--mantine-color-gray-2)",
              cursor: booked ? "not-allowed" : "pointer",
              background: booked
                ? "var(--mantine-color-red-4)"
                : isSel
                  ? "var(--mantine-color-brand-5)"
                  : "white",
              transition: "background 80ms",
            }}
            title={booked ? "Đã đặt" : `${court.name} · ${slotStart(slot)}`}
          />
        );
      })}
    </>
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
