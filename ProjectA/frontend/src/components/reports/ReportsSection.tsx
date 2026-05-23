import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Center,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { BarChart, LineChart } from "@mantine/charts";
import { PageHeader } from "../common";
import { analyticsService } from "../../services/analyticsService";
import type { Booking, Order } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const money = (v: number) => formatVnd(v);

/** Khung 1 biểu đồ: tiêu đề + nội dung (hoặc thông báo rỗng). */
function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Text fw={600} mb="md">
        {title}
      </Text>
      {empty ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          Chưa có dữ liệu trong khoảng đã chọn.
        </Text>
      ) : (
        children
      )}
    </Card>
  );
}

export function ReportsSection() {
  const [data, setData] = useState<any>({
    revenue: [],
    trends: [],
    peak: [],
    tops: [],
    courts: []
  });
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState("14");

  useEffect(() => {
    setLoading(true);
    analyticsService.getReports(Number(rangeDays))
      .then((res) => {
        setData({
          ...res,
          revenue: res.revenue.map((r: any) => ({ date: r.date, "Tiền sân": r.tiền_sân, "Bán hàng": r.bán_hàng })),
          trends: res.trends.map((t: any) => ({ date: t.date, "Lượt đặt": t.lượt_đặt, "Hủy": t.hủy })),
          peak: res.peak.map((p: any) => ({ hour: p.hour, "Lượt đặt": p.lượt_đặt })),
          tops: res.tops.map((t: any) => ({ name: t.name, "Chi tiêu": t.chi_tiêu })),
          courts: res.courts.map((c: any) => ({ court: c.court, "Doanh thu": c.doanh_thu }))
        });
      })
      .catch((e) => notify.error(toMessage(e)))
      .finally(() => setLoading(false));
  }, [rangeDays]);

  if (loading) {
    return (
      <>
        <PageHeader title="Báo cáo & Phân tích" subtitle="Doanh thu, lượt đặt và hiệu suất sân" />
        <Center mih="50vh">
          <Loader />
        </Center>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Báo cáo & Phân tích"
        subtitle="Doanh thu, lượt đặt và hiệu suất sân"
        actions={
          <Select
            w={150}
            value={rangeDays}
            onChange={(v) => setRangeDays(v ?? "14")}
            data={[
              { value: "7", label: "7 ngày" },
              { value: "14", label: "14 ngày" },
              { value: "30", label: "30 ngày" },
            ]}
          />
        }
      />

      <Stack>
        <ChartCard title="Doanh thu theo ngày (tiền sân + bán hàng)">
          <BarChart
            h={280}
            data={data.revenue}
            dataKey="date"
            type="stacked"
            series={[
              { name: "Tiền sân", color: "brand.6" },
              { name: "Bán hàng", color: "grape.5" },
            ]}
            valueFormatter={money}
          />
        </ChartCard>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <ChartCard title="Xu hướng lượt đặt" empty={data.trends.length === 0}>
            <LineChart
              h={260}
              data={data.trends}
              dataKey="date"
              series={[
                { name: "Lượt đặt", color: "teal.6" },
                { name: "Hủy", color: "red.5" },
              ]}
              curveType="monotone"
            />
          </ChartCard>

          <ChartCard title="Giờ cao điểm" empty={data.peak.length === 0}>
            <BarChart
              h={260}
              data={data.peak}
              dataKey="hour"
              series={[{ name: "Lượt đặt", color: "orange.5" }]}
            />
          </ChartCard>

          <ChartCard title="Top khách hàng (chi tiêu)" empty={data.tops.length === 0}>
            <BarChart
              h={260}
              data={data.tops}
              dataKey="name"
              orientation="vertical"
              series={[{ name: "Chi tiêu", color: "indigo.5" }]}
              valueFormatter={money}
            />
          </ChartCard>

          <ChartCard title="Hiệu suất theo sân (doanh thu)" empty={data.courts.length === 0}>
            <BarChart
              h={260}
              data={data.courts}
              dataKey="court"
              series={[{ name: "Doanh thu", color: "blue.6" }]}
              valueFormatter={money}
            />
          </ChartCard>
        </SimpleGrid>

        <Text size="xs" c="dimmed">
          Số liệu được tổng hợp trực tiếp từ cơ sở dữ liệu.
        </Text>
      </Stack>
    </>
  );
}
