import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Group,
  Stack,
  Text,
  Title,
  TextInput,
  LoadingOverlay,
} from "@mantine/core";
import type { Booking, Court } from "../types/domain";
import { courtService } from "../services/courtService";
import { bookingService, setCourtMaps } from "../services/bookingService";
import { BookingGrid } from "../components/BookingGrid";
import { BookingSummary } from "../components/BookingSummary";
import { AppLoader } from "../components/AppLoader";
import { formatDateVi } from "../lib/format";
import { keyOf } from "../lib/selection";

const todayIso = new Date().toISOString().slice(0, 10);

export function BookingPage() {
  const [date, setDate] = useState(todayIso);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    courtService.list().then((c) => {
      setCourts(c);
      setCourtMaps(c);
    });
  }, []);

  const loadBookings = (d: string) => {
    setLoading(true);
    bookingService
      .listByDate(d)
      .then(setBookings)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelected(new Set());
    loadBookings(date);
  }, [date]);

  const bookedByCourt = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    for (const b of bookings) {
      if (b.status === "cancelled") continue; // lượt đã hủy không chiếm ô
      const set = (map[b.courtId] ??= new Set());
      for (let s = b.startSlot; s < b.endSlot; s++) set.add(s);
    }
    return map;
  }, [bookings]);

  const toggle = (courtId: string, slot: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = keyOf(courtId, slot);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Container size="xl" py="lg">
      <Group justify="space-between" align="flex-end" mb="md" wrap="wrap">
        <Stack gap={2}>
          <Title order={3}>Lịch đặt sân</Title>
          <Text c="dimmed" size="sm">
            {formatDateVi(date)}
          </Text>
        </Stack>
        <Group align="flex-end" gap="lg">
          <TextInput
            type="date"
            label="Chọn ngày"
            min={todayIso}
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
          <Legend />
        </Group>
      </Group>

      <Group align="flex-start" gap="lg" wrap="wrap">
        <Box style={{ flex: 1, minWidth: 320, position: "relative" }}>
          <LoadingOverlay
            visible={loading}
            zIndex={5}
            overlayProps={{ blur: 2, backgroundOpacity: 0.55 }}
            loaderProps={{ children: <AppLoader label="Đang tải lịch sân..." /> }}
          />
          {courts.length > 0 && (
            <BookingGrid
              courts={courts}
              bookedByCourt={bookedByCourt}
              selected={selected}
              onToggle={toggle}
            />
          )}
          <Text size="xs" c="dimmed" mt={6}>
            Bấm vào ô trống để chọn; bấm lại để bỏ chọn.
          </Text>
        </Box>

        <Box style={{ width: 300, flexShrink: 0 }}>
          <Box style={{ position: "sticky", top: 16 }}>
            <BookingSummary
              date={date}
              courts={courts}
              selected={selected}
              onConfirmed={() => loadBookings(date)}
            />
          </Box>
        </Box>
      </Group>
    </Container>
  );
}

function Legend() {
  return (
    <Group gap="md">
      <LegendItem color="white" border label="Trống" />
      <LegendItem color="var(--mantine-color-brand-5)" label="Đang chọn" />
      <LegendItem color="var(--mantine-color-red-4)" label="Đã đặt" />
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
