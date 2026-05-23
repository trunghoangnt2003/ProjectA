import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Card, Group, Menu, Table, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { PageHeader } from "../common";
import { employeeService } from "../../services/employeeService";
import { rosterService, weekDays } from "../../services/rosterService";
import { WORK_SHIFTS, SHIFT_COLOR } from "../../constants/shifts";
import type { Employee, ShiftAssignment } from "../../types/domain";
import { toMessage, notify } from "../../lib/notify";

const DOW = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const dayNum = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

export function RosterSection() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [weekBase, setWeekBase] = useState(new Date());

  const days = useMemo(() => weekDays(weekBase), [weekBase]);

  const loadAssignments = () =>
    rosterService.getAll({ pageSize: 1000 }).then(res => setAssignments(res.items)).catch((e) => notify.error(toMessage(e)));

  useEffect(() => {
    employeeService.getAll({ pageSize: 1000 }).then((res) => setEmployees(res.items.filter((e) => e.status === "active")));
    loadAssignments();
  }, []);

  const map = useMemo(() => {
    const m = new Map<string, ShiftAssignment>();
    for (const a of assignments) m.set(`${a.employeeId}:${a.date}`, a);
    return m;
  }, [assignments]);

  const setShift = async (emp: Employee, date: string, shift: string | null) => {
    const existing = map.get(`${emp.id}:${date}`);
    try {
      if (!shift) {
        if (existing) await rosterService.delete(existing.id);
      } else if (existing) {
        const { id, ...rest } = existing;
        await rosterService.update(id, { ...rest, shift });
      } else {
        await rosterService.create({ employeeId: emp.id, employeeName: emp.name, date, shift });
      }
      await loadAssignments();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const shiftWeek = (delta: number) => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + delta * 7);
    setWeekBase(d);
  };

  return (
    <>
      <PageHeader title="Phân ca" subtitle="Lịch phân ca theo tuần — bấm ô để gán / đổi ca" />

      <Card mb="md" p="sm">
        <Group justify="space-between">
          <Button variant="default" size="xs" leftSection={<IconChevronLeft size={14} />} onClick={() => shiftWeek(-1)}>
            Tuần trước
          </Button>
          <Text fw={600}>Tuần {dayNum(days[0])} – {dayNum(days[6])}</Text>
          <Button variant="default" size="xs" rightSection={<IconChevronRight size={14} />} onClick={() => shiftWeek(1)}>
            Tuần sau
          </Button>
        </Group>
      </Card>

      <Card p={0} style={{ overflowX: "auto" }}>
        <Table withColumnBorders striped highlightOnHover miw={720}>
          <Table.Thead bg="var(--mantine-color-gray-0)">
            <Table.Tr>
              <Table.Th style={{ minWidth: 150 }}>Nhân viên</Table.Th>
              {days.map((d, i) => (
                <Table.Th key={d} ta="center">
                  <div>{DOW[i]}</div>
                  <Text size="10px" c="dimmed">{dayNum(d)}</Text>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.map((emp) => (
              <Table.Tr key={emp.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>{emp.name}</Text>
                  <Text size="xs" c="dimmed">{emp.position}</Text>
                </Table.Td>
                {days.map((date) => {
                  const a = map.get(`${emp.id}:${date}`);
                  return (
                    <Table.Td key={date} ta="center">
                      <Menu position="bottom" withinPortal>
                        <Menu.Target>
                          <Box style={{ cursor: "pointer", minHeight: 26 }}>
                            {a ? (
                              <Badge variant="light" color={SHIFT_COLOR[a.shift]}>{a.shift}</Badge>
                            ) : (
                              <Text c="dimmed" size="sm">–</Text>
                            )}
                          </Box>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {WORK_SHIFTS.map((s) => (
                            <Menu.Item key={s.value} onClick={() => setShift(emp, date, s.value)}>
                              {s.label}
                            </Menu.Item>
                          ))}
                          {a && (
                            <>
                              <Menu.Divider />
                              <Menu.Item color="red" onClick={() => setShift(emp, date, null)}>
                                Bỏ ca
                              </Menu.Item>
                            </>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
      <Group mt="sm" gap="md">
        {WORK_SHIFTS.map((s) => (
          <Group key={s.value} gap={6}>
            <Badge variant="light" color={SHIFT_COLOR[s.value]}>{s.value}</Badge>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Group>
        ))}
      </Group>
    </>
  );
}
