import { useEffect, useMemo, useState } from "react";
import { Card, Group, Progress, SimpleGrid, Text, TextInput } from "@mantine/core";
import { IconCash, IconCalendarStats } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { attendanceService } from "../../services/attendanceService";
import { employeeService } from "../../services/employeeService";
import type { Attendance, Employee } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const curMonth = new Date().toISOString().slice(0, 7); // yyyy-mm

interface PayrollRow {
  id: string;
  name: string;
  position: string;
  worked: number; // ca công (có mặt + muộn)
  absent: number;
  onTime: number; // %
  shiftRate: number;
  salary: number;
}

export function PayrollSection() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(curMonth);

  useEffect(() => {
    Promise.all([employeeService.list(), attendanceService.list()])
      .then(([e, a]) => {
        setEmployees(e);
        setAttendance(a);
      })
      .catch((e) => notify.error(toMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo<PayrollRow[]>(() => {
    return employees
      .filter((e) => e.status === "active")
      .map((e) => {
        const recs = attendance.filter((a) => a.employeeId === e.id && a.date.startsWith(month));
        const present = recs.filter((r) => r.status === "present").length;
        const late = recs.filter((r) => r.status === "late").length;
        const absent = recs.filter((r) => r.status === "absent").length;
        const worked = present + late;
        const total = present + late + absent;
        return {
          id: e.id,
          name: e.name,
          position: e.position,
          worked,
          absent,
          onTime: total > 0 ? Math.round((present / total) * 100) : 0,
          shiftRate: e.shiftRate,
          salary: worked * e.shiftRate,
        };
      });
  }, [employees, attendance, month]);

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
