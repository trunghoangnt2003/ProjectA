import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconDots, IconCircleCheck, IconClockExclamation, IconUserX } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { attendanceService } from "../../services/attendanceService";
import { employeeService } from "../../services/employeeService";
import { SHIFT_OPTIONS } from "../../constants/shifts";
import type { Attendance, AttendanceStatus, Employee } from "../../types/domain";
import { toMessage, notify } from "../../lib/notify";

const STATUS_META: Record<AttendanceStatus, { label: string; color: string }> = {
  present: { label: "Có mặt", color: "teal" },
  late: { label: "Đi muộn", color: "orange" },
  absent: { label: "Vắng", color: "red" },
};
const todayIso = new Date().toISOString().slice(0, 10);

export function AttendanceSection() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayIso);
  const [opened, { open, close }] = useDisclosure(false);

  // form thêm chấm công
  const [empId, setEmpId] = useState<string | null>(null);
  const [shift, setShift] = useState("S1");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([attendanceService.list(), employeeService.list()])
      .then(([a, e]) => {
        setRecords(a);
        setEmployees(e.filter((x) => x.status === "active"));
      })
      .catch((e) => notify.error(toMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const dayRecords = useMemo(
    () => records.filter((r) => r.date === date),
    [records, date]
  );

  const stats = useMemo(() => ({
    present: dayRecords.filter((r) => r.status === "present").length,
    late: dayRecords.filter((r) => r.status === "late").length,
    absent: dayRecords.filter((r) => r.status === "absent").length,
  }), [dayRecords]);

  const changeStatus = async (r: Attendance, s: AttendanceStatus) => {
    const { id, ...rest } = r;
    try {
      await attendanceService.update(id, { ...rest, status: s });
      load();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const submitAdd = async () => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return notify.error("Chọn nhân viên.");
    setSaving(true);
    try {
      await attendanceService.create({
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        shift,
        status,
        checkIn: status === "absent" ? undefined : checkIn || undefined,
        checkOut: status === "absent" ? undefined : checkOut || undefined,
      });
      notify.success("Đã chấm công.");
      close();
      setEmpId(null); setStatus("present"); setCheckIn(""); setCheckOut("");
      load();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Attendance>[] = [
    { key: "name", header: "Nhân viên", render: (r) => <Text fw={500}>{r.employeeName}</Text> },
    { key: "shift", header: "Ca", render: (r) => r.shift },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => <Badge variant="light" color={STATUS_META[r.status].color}>{STATUS_META[r.status].label}</Badge>,
    },
    { key: "in", header: "Vào", render: (r) => r.checkIn ?? "—" },
    { key: "out", header: "Ra", render: (r) => r.checkOut ?? "—" },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 50,
      render: (r) => (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle"><IconDots size={18} /></ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Đổi trạng thái</Menu.Label>
            <Menu.Item color="teal" leftSection={<IconCircleCheck size={16} />} onClick={() => changeStatus(r, "present")}>Có mặt</Menu.Item>
            <Menu.Item color="orange" leftSection={<IconClockExclamation size={16} />} onClick={() => changeStatus(r, "late")}>Đi muộn</Menu.Item>
            <Menu.Item color="red" leftSection={<IconUserX size={16} />} onClick={() => changeStatus(r, "absent")}>Vắng</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  // Nhân viên chưa chấm công hôm đó.
  const notRecorded = employees.filter((e) => !dayRecords.some((r) => r.employeeId === e.id));

  return (
    <>
      <PageHeader
        title="Chấm công"
        subtitle="Ghi nhận có mặt / đi muộn / vắng theo ngày"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open} disabled={notRecorded.length === 0}>
            Chấm công
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard label="Có mặt" value={stats.present} icon={<IconCircleCheck size={26} />} color="teal" />
        <StatCard label="Đi muộn" value={stats.late} icon={<IconClockExclamation size={26} />} color="orange" />
        <StatCard label="Vắng" value={stats.absent} icon={<IconUserX size={26} />} color="red" />
      </SimpleGrid>

      <Card mb="md" p="md">
        <TextInput label="Ngày" type="date" w={200} value={date} onChange={(e) => setDate(e.currentTarget.value)} />
      </Card>

      <DataTable
        data={dayRecords}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="Chưa có chấm công ngày này"
      />

      <Modal opened={opened} onClose={close} title="Chấm công" centered>
        <Stack>
          <Select
            label="Nhân viên"
            required
            searchable
            placeholder="Chọn nhân viên"
            data={notRecorded.map((e) => ({ value: e.id, label: e.name }))}
            value={empId}
            onChange={(v) => {
              setEmpId(v);
              const emp = employees.find((e) => e.id === v);
              if (emp) setShift(emp.shift);
            }}
          />
          <Select label="Ca" data={SHIFT_OPTIONS} value={shift} onChange={(v) => setShift(v ?? "S1")} />
          <Select
            label="Trạng thái"
            data={Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
            value={status}
            onChange={(v) => setStatus((v as AttendanceStatus) ?? "present")}
          />
          {status !== "absent" && (
            <Group grow>
              <TextInput label="Giờ vào" type="time" value={checkIn} onChange={(e) => setCheckIn(e.currentTarget.value)} />
              <TextInput label="Giờ ra" type="time" value={checkOut} onChange={(e) => setCheckOut(e.currentTarget.value)} />
            </Group>
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
            <Button onClick={submitAdd} loading={saving}>Lưu</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
