import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { IconSearch, IconTicket, IconCalendarEvent } from "@tabler/icons-react";
import { courtService } from "../services/courtService";
import { bookingService } from "../services/bookingService";
import type { Booking, Court } from "../types/domain";
import { slotStart, slotEnd } from "../lib/time";
import { getPlayStatus } from "../lib/bookingStatus";
import { formatVnd, formatDateVi } from "../lib/format";
import { AppLoader } from "../components/AppLoader";

export function LookupPage() {
  const [query, setQuery] = useState("");
  const [courts, setCourts] = useState<Court[]>([]);
  const [results, setResults] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    courtService.list().then(setCourts);
  }, []);

  const courtById = useMemo(
    () => new Map(courts.map((c) => [c.id, c])),
    [courts]
  );

  const onSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await bookingService.search(query);
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap={4} mb="lg">
        <ThemeIcon size={52} radius="xl" variant="light" color="brand">
          <IconTicket size={28} />
        </ThemeIcon>
        <Title order={2} ta="center">
          Tra cứu đặt sân
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Nhập <b>mã đặt sân</b> (vd BK-1001) hoặc <b>số điện thoại</b> để xem lịch đã đặt.
        </Text>
      </Stack>

      <Card withBorder>
        <Group align="flex-end" gap="sm">
          <TextInput
            style={{ flex: 1 }}
            label="Mã đặt sân hoặc số điện thoại"
            placeholder="BK-1001 hoặc 0901234567"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            leftSection={<IconSearch size={16} />}
          />
          <Button onClick={onSearch} loading={loading}>
            Tra cứu
          </Button>
        </Group>
      </Card>

      {loading ? (
        <Center py="xl">
          <AppLoader label="Đang tra cứu..." />
        </Center>
      ) : searched && results.length === 0 ? (
        <Card withBorder mt="lg">
          <Text ta="center" c="dimmed" py="md">
            Không tìm thấy lượt đặt nào khớp với “{query}”.
          </Text>
        </Card>
      ) : (
        results.length > 0 && (
          <Stack mt="lg" gap="md">
            {results.map((b) => {
              const court = courtById.get(b.courtId);
              const status = getPlayStatus(b);
              return (
                <Card key={b.id} withBorder className="hover-lift">
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconTicket size={18} color="var(--mantine-color-accent-6)" />
                      <Text fw={700} c="accent.6">
                        {b.code}
                      </Text>
                    </Group>
                    <Badge color={status.color} variant="light" size="lg">
                      {status.label}
                    </Badge>
                  </Group>

                  <Group gap="xl">
                    <InfoCol label="Sân" value={court?.name ?? b.courtId} />
                    <InfoCol label="Ngày" value={formatDateVi(b.date)} />
                    <InfoCol
                      label="Khung giờ"
                      value={`${slotStart(b.startSlot)} – ${slotEnd(b.endSlot - 1)}`}
                    />
                  </Group>

                  <Group justify="space-between" mt="md">
                    <Group gap={6}>
                      <IconCalendarEvent size={16} color="var(--mantine-color-dimmed)" />
                      <Text size="sm" c="dimmed">
                        {b.customerName} · {b.phone}
                      </Text>
                    </Group>
                    <Text fw={700}>{formatVnd(b.totalPrice)}</Text>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )
      )}
    </Container>
  );
}

function InfoCol({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </div>
  );
}
