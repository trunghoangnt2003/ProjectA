import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconMapPin,
  IconPhone,
  IconClock,
  IconCalendarPlus,
  IconActivity,
  IconBulb,
  IconCar,
  IconWifi,
  IconShoppingBag,
  IconArrowRight,
} from "@tabler/icons-react";
import { venue } from "../data/venue";
import { courtService } from "../services/courtService";
import type { Court } from "../types/domain";
import { formatPriceRange, priceRange } from "../lib/pricing";
import { formatVnd } from "../lib/format";
import { VenueMap } from "../components/VenueMap";

interface HomePageProps {
  onBook: () => void;
}

const FEATURES = [
  { icon: IconActivity, title: "Mặt sân tiêu chuẩn", desc: "Thảm chuyên dụng, chống trơn" },
  { icon: IconBulb, title: "Đèn chống chói", desc: "Ánh sáng đều, không loá mắt" },
  { icon: IconCar, title: "Bãi giữ xe rộng", desc: "An ninh, có mái che" },
  { icon: IconShoppingBag, title: "Thuê vợt · bán cầu", desc: "Đầy đủ dụng cụ tại sân" },
  { icon: IconWifi, title: "Wifi miễn phí", desc: "Khu chờ tiện nghi" },
  { icon: IconClock, title: "Mở cửa 05:00–24:00", desc: "Đặt sân mọi khung giờ" },
];

const GALLERY = [
  "linear-gradient(135deg,#1f9d6b,#4fb98b)",
  "linear-gradient(135deg,#126e4a,#2faa77)",
  "linear-gradient(135deg,#d4542f,#e2704f)",
  "linear-gradient(135deg,#17855a,#79caa6)",
];

export function HomePage({ onBook }: HomePageProps) {
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    courtService.list().then(setCourts);
  }, []);

  const minPrice = courts
    .map((c) => priceRange(c.priceSlots)?.min ?? Infinity)
    .reduce((a, b) => Math.min(a, b), Infinity);

  const stats = [
    { value: `${courts.length || 10}`, label: "Sân thi đấu" },
    { value: "05–24h", label: "Giờ mở cửa" },
    {
      value: Number.isFinite(minPrice) ? `${Math.round(minPrice / 1000)}K` : "80K",
      label: "Giá chỉ từ",
    },
    { value: "24/7", label: "Đặt online" },
  ];

  return (
    <>
      {/* HERO */}
      <Box
        style={{
          background: "var(--mantine-color-brand-8)",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(47,170,119,0.35), transparent 42%)," +
            "radial-gradient(circle at 85% 0%, rgba(212,84,47,0.20), transparent 38%)," +
            "linear-gradient(135deg, #126e4a 0%, #1f9d6b 60%, #2faa77 100%)",
          color: "white",
        }}
      >
        <Container size="lg" py={64}>
          <Stack gap="lg" maw={680}>
            <Badge
              size="lg"
              variant="white"
              c="brand.7"
              radius="sm"
              w="fit-content"
            >
              ⚡ {venue.tagline}
            </Badge>
            <Title order={1} fz={{ base: 36, sm: 52 }} fw={800} lh={1.05}>
              Đặt sân cầu lông
              <br />
              chỉ trong vài giây
            </Title>
            <Text fz="lg" opacity={0.95} maw={560}>
              {venue.description}
            </Text>
            <Group mt="xs">
              <Button
                size="lg"
                color="accent"
                radius="xl"
                rightSection={<IconArrowRight size={20} />}
                onClick={onBook}
              >
                Đặt sân ngay
              </Button>
              <Button
                size="lg"
                radius="xl"
                variant="white"
                c="brand.7"
                component="a"
                href={`tel:${venue.phone.replace(/\s/g, "")}`}
                leftSection={<IconPhone size={18} />}
              >
                {venue.phone}
              </Button>
            </Group>

            {/* Stat chips */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} mt="lg" spacing="md">
              {stats.map((s) => (
                <Box
                  key={s.label}
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    backdropFilter: "blur(6px)",
                    borderRadius: "var(--mantine-radius-lg)",
                    padding: "12px 16px",
                  }}
                >
                  <Text fz={26} fw={800} lh={1}>
                    {s.value}
                  </Text>
                  <Text size="xs" opacity={0.9} mt={4}>
                    {s.label}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py={48}>
        {/* FEATURES */}
        <Stack align="center" gap={4} mb="xl">
          <Text tt="uppercase" fw={700} c="brand.7" size="sm" lts={1}>
            Vì sao chọn chúng tôi
          </Text>
          <Title order={2} ta="center">
            Trải nghiệm sân đỉnh cao
          </Title>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {FEATURES.map((f) => (
            <Card key={f.title} className="hover-lift" withBorder>
              <ThemeIcon size={52} radius="md" variant="light" color="brand">
                <f.icon size={28} />
              </ThemeIcon>
              <Text fw={700} mt="md" fz="lg">
                {f.title}
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                {f.desc}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        {/* GALLERY */}
        <Title order={2} mt={56} mb="lg">
          Hình ảnh sân
        </Title>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          {GALLERY.map((bg, i) => (
            <Box
              key={i}
              className="hover-lift"
              style={{
                height: 160,
                borderRadius: "var(--mantine-radius-lg)",
                background: bg,
                display: "flex",
                alignItems: "flex-end",
                padding: 14,
                color: "white",
                fontWeight: 700,
              }}
            >
              Khu {String.fromCharCode(65 + i)}
            </Box>
          ))}
        </SimpleGrid>

        {/* ĐỊA ĐIỂM + MAP */}
        <Title order={2} mt={56} mb="lg">
          Địa điểm & chỉ đường
        </Title>
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Card withBorder h="100%">
              <Stack gap="md">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon size={40} radius="md" variant="light" color="brand">
                    <IconMapPin size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700}>Địa chỉ</Text>
                    <Text size="sm" c="dimmed">
                      {venue.address}
                    </Text>
                  </div>
                </Group>
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon size={40} radius="md" variant="light" color="accent">
                    <IconPhone size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700}>Hotline</Text>
                    <Text size="sm" c="dimmed">
                      {venue.phone}
                    </Text>
                  </div>
                </Group>
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon size={40} radius="md" variant="light" color="brand">
                    <IconClock size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700}>Giờ mở cửa</Text>
                    <Text size="sm" c="dimmed">
                      {venue.openHours}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <VenueMap query={venue.mapQuery} height={340} />
          </Grid.Col>
        </Grid>

        {/* SÂN & BẢNG GIÁ */}
        <Title order={2} mt={56} mb="lg">
          Sân & bảng giá
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {courts.map((c) => (
            <Card key={c.id} className="hover-lift" withBorder>
              <Group justify="space-between">
                <Text fw={700} fz="lg">
                  {c.name}
                </Text>
                <Badge variant="light" color="brand">
                  {c.zone}
                </Badge>
              </Group>
              <Text fw={800} c="accent.6" fz="xl" mt="xs">
                {formatPriceRange(c.priceSlots)}
              </Text>
              <Stack gap={2} mt="sm">
                {c.priceSlots.map((s, i) => (
                  <Group key={i} justify="space-between">
                    <Text size="xs" c="dimmed">
                      {s.start}–{s.end}
                    </Text>
                    <Text size="xs" fw={500}>
                      {formatVnd(s.pricePerHour)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      {/* CTA BAND */}
      <Box style={{ background: "var(--mantine-color-accent-6)", color: "white" }}>
        <Container size="lg" py={48}>
          <Group justify="space-between" wrap="wrap" gap="lg">
            <div>
              <Title order={2}>Sẵn sàng ra sân?</Title>
              <Text opacity={0.95}>Chọn khung giờ yêu thích và đặt ngay hôm nay.</Text>
            </div>
            <Button
              size="lg"
              radius="xl"
              variant="white"
              c="accent.7"
              leftSection={<IconCalendarPlus size={20} />}
              onClick={onBook}
            >
              Đặt sân ngay
            </Button>
          </Group>
        </Container>
      </Box>
    </>
  );
}
