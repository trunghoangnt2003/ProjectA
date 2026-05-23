import { useEffect, useState } from "react";
import { Card, Group, Progress, SimpleGrid, Text, TextInput } from "@mantine/core";
import { IconCash, IconCalendarStats } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { payrollService } from "../../services/payrollService";
import type { PayrollRow } from "../../services/payrollService";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const curMonth = new Date().toISOString().slice(0, 7); // yyyy-mm

export function PayrollSection() {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(curMonth);

  useEffect(() => {
    setLoading(true);
    payrollService.getPayroll(month)
      .then(setRows)
      .catch((e) => notify.error(toMessage(e)))
      .finally(() => setLoading(false));
  }, [month]);

  const totalPayroll = rows.reduce((s, r) => s + r.salary, 0);
  const totalShifts = rows.reduce((s, r) => s + r.worked, 0);

  const columns: DataTableColumn<PayrollRow>[] = [
    {
      key: "name",
      header: "Nhân viên",
      render: (r) => (
        <div>
          <Text fw={500}>{r.name}</Text>
          <Text size="xs" c="dimmed">{r.position}</Text>
        </div>
      ),
    },
    { key: "worked", header: "Ca công", align: "right", render: (r) => r.worked },
    { key: "absent", header: "Vắng", align: "right", render: (r) => (r.absent > 0 ? <Text c="red">{r.absent}</Text> : "0") },
    {
      key: "ontime",
      header: "Đúng giờ (KPI)",
      render: (r) => (
        <Group gap="xs" wrap="nowrap">
          <Progress value={r.onTime} w={70} size="sm" color={r.onTime >= 90 ? "teal" : r.onTime >= 75 ? "orange" : "red"} />
          <Text size="xs">{r.onTime}%</Text>
        </Group>
      ),
    },
    { key: "rate", header: "Lương/ca", align: "right", render: (r) => formatVnd(r.shiftRate) },
    { key: "salary", header: "Tổng lương", align: "right", render: (r) => <Text fw={700}>{formatVnd(r.salary)}</Text> },
  ];

  return (
    <>
      <PageHeader
        title="Bảng lương & KPI"
        subtitle="Tính lương theo ca công + chỉ số đúng giờ trong tháng"
        actions={
          <TextInput type="month" value={month} onChange={(e) => setMonth(e.currentTarget.value)} />
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="lg">
        <StatCard label="Tổng quỹ lương tháng" value={formatVnd(totalPayroll)} icon={<IconCash size={26} />} color="grape" />
        <StatCard label="Tổng ca công" value={totalShifts} icon={<IconCalendarStats size={26} />} color="brand" />
      </SimpleGrid>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="Chưa có dữ liệu chấm công tháng này"
      />
      <Text size="xs" c="dimmed" mt="sm">
        Lương = số ca công (có mặt + đi muộn) × lương/ca. KPI đúng giờ = tỉ lệ ca có mặt đúng giờ.
      </Text>
    </>
  );
}
