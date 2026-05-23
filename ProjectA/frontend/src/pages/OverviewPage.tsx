import { useEffect, useState } from "react";
import { Progress, SimpleGrid, Stack, Text, Badge, Card, Group } from "@mantine/core";
import {
  IconCalendarEvent,
  IconBuildingStadium,
  IconCash,
  IconUsers,
  IconPlayerPlay,
  IconDoorEnter,
} from "@tabler/icons-react";
import { PageHeader, StatCard, DataTable } from "../components/common";
import type { DataTableColumn } from "../components/common";
import { STATUS_META } from "../components/bookings/bookingStatus";
import { bookingService } from "../services/bookingService";
import { analyticsService, type OverviewMetrics } from "../services/analyticsService";
import type { Booking } from "../types/domain";
import { formatVnd, formatDate } from "../lib/format";

const todayIso = new Date().toISOString().slice(0, 10);

const EMPTY_METRICS: OverviewMetrics = {
  revenueToday: 0,
  bookingsToday: 0,
  operationalCourts: 0,
  totalCourts: 0,
  freeCourtsNow: 0,
  playingNow: 0,
  occupancyToday: 0,
};

/** Trang Tổng quan — chỉ số vận hành hôm nay (mock tổng hợp từ các service). */
export function OverviewPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState(0);
  const [metrics, setMetrics] = useState<OverviewMetrics>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await analyticsService.getOverview();
        setMetrics(data);

        // Fetch bookings for today separately
        const res = await bookingService.getAll({ date: todayIso, pageSize: 100 });
        setTodayBookings(res.items.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      } catch (e) {
        // Handle error if needed
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const columns: DataTableColumn<Booking>[] = [
    { key: "code", header: "Mã", render: (b) => b.code },
    { key: "customer", header: "Khách hàng", render: (b) => b.customerName },
    { key: "court", header: "Sân", render: (b) => b.courtName },
    {
      key: "time",
      header: "Thời gian",
      render: (b) => `${formatDate(b.date)} · ${b.startTime}–${b.endTime}`,
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (b) => (
        <Badge variant="light" color={STATUS_META[b.status].color}>
          {STATUS_META[b.status].label}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle="Tình hình hoạt động hôm nay"
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        <StatCard
          label="Doanh thu hôm nay"
          value={formatVnd(metrics.revenueToday)}
          icon={<IconCash size={26} />}
          color="grape"
        />
        <StatCard
          label="Lượt đặt hôm nay"
          value={metrics.bookingsToday}
          icon={<IconCalendarEvent size={26} />}
          color="brand"
        />
        <StatCard
          label="Khách đang chơi"
          value={metrics.playingNow}
          icon={<IconPlayerPlay size={26} />}
          color="orange"
        />
        <StatCard
          label="Sân đang hoạt động"
          value={`${metrics.operationalCourts}/${metrics.totalCourts}`}
          icon={<IconBuildingStadium size={26} />}
          color="teal"
        />
        <StatCard
          label="Sân trống lúc này"
          value={metrics.freeCourtsNow}
          icon={<IconDoorEnter size={26} />}
          color="blue"
        />
        <StatCard
          label="Khách hàng"
          value={customers}
          icon={<IconUsers size={26} />}
          color="indigo"
        />
      </SimpleGrid>

      <Card mt="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Tỉ lệ lấp đầy sân hôm nay</Text>
          <Text fw={700} c="brand">
            {metrics.occupancyToday}%
          </Text>
        </Group>
        <Progress value={metrics.occupancyToday} size="lg" radius="md" />
        <Text size="xs" c="dimmed" mt={6}>
          Số ô giờ đã đặt / tổng số ô của các sân vận hành (05:00–24:00).
        </Text>
      </Card>

      <Stack gap="sm" mt="lg">
        <Text fw={600}>Lịch đặt hôm nay</Text>
        <DataTable
          data={todayBookings}
          columns={columns}
          rowKey={(b) => b.id}
          loading={loading}
          emptyTitle="Hôm nay chưa có lượt đặt"
        />
      </Stack>
    </>
  );
}
