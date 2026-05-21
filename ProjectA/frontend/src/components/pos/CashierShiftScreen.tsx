import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Divider, Group, NumberInput, Stack, Table, Text, TextInput } from "@mantine/core";
import { IconLockOpen, IconLock, IconCash } from "@tabler/icons-react";
import { cashierShiftService } from "../../services/cashierShiftService";
import { orderService } from "../../services/orderService";
import type { CashierShift, Order } from "../../types/domain";
import { formatVnd, formatDateTime } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

/** Tổng tiền bán hàng phát sinh trong khoảng [from, to]. */
function salesBetween(orders: Order[], fromIso: string, toIso: string): number {
  return orders
    .filter((o) => o.createdAt >= fromIso && o.createdAt <= toIso)
    .reduce((s, o) => s + o.total, 0);
}

export function CashierShiftScreen() {
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashier, setCashier] = useState("");
  const [openingCash, setOpeningCash] = useState(1000000);
  const [countedCash, setCountedCash] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = () => {
    cashierShiftService.list().then(setShifts);
    orderService.list().then(setOrders);
  };
  useEffect(load, []);

  const openShift = useMemo(() => shifts.find((s) => s.status === "open"), [shifts]);
  const history = useMemo(
    () => shifts.filter((s) => s.status === "closed").sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? "")),
    [shifts]
  );

  const liveSales = openShift ? salesBetween(orders, openShift.openedAt, new Date().toISOString()) : 0;
  const expected = openShift ? openShift.openingCash + liveSales : 0;

  const doOpen = async () => {
    if (!cashier.trim()) return notify.error("Nhập tên thu ngân.");
    setBusy(true);
    try {
      await cashierShiftService.create({
        cashier: cashier.trim(),
        openedAt: new Date().toISOString(),
        openingCash,
        status: "open",
      });
      notify.success("Đã mở ca.");
      setCashier("");
      load();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const doClose = async () => {
    if (!openShift) return;
    setBusy(true);
    const { id, ...rest } = openShift;
    const diff = countedCash - expected;
    try {
      await cashierShiftService.update(id, {
        ...rest,
        status: "closed",
        closedAt: new Date().toISOString(),
        countedCash,
        note: diff === 0 ? "Khớp quỹ." : diff > 0 ? `Thừa ${formatVnd(diff)}` : `Thiếu ${formatVnd(-diff)}`,
      });
      notify.success("Đã đóng ca.");
      setCountedCash(0);
      load();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack maw={680}>
      <Text fw={700} size="xl">Ca thu ngân</Text>

      {openShift ? (
        <Card withBorder>
          <Group justify="space-between">
            <Text fw={600}>Ca đang mở · {openShift.cashier}</Text>
            <Badge color="teal" variant="filled">Đang mở</Badge>
          </Group>
          <Text size="xs" c="dimmed">Mở lúc {formatDateTime(openShift.openedAt)}</Text>

          <Divider my="sm" />
          <Row label="Tiền đầu ca" value={formatVnd(openShift.openingCash)} />
          <Row label="Doanh thu bán hàng trong ca" value={formatVnd(liveSales)} />
          <Row label="Tiền mặt dự kiến" value={formatVnd(expected)} strong />

          <NumberInput
            mt="md"
            label="Tiền mặt kiểm kê thực tế (₫)"
            min={0}
            step={50000}
            thousandSeparator="."
            decimalSeparator=","
            value={countedCash}
            onChange={(v) => setCountedCash(Number(v) || 0)}
          />
          {countedCash > 0 && (
            <Text size="sm" mt={4} c={countedCash - expected === 0 ? "teal" : countedCash - expected > 0 ? "blue" : "red"}>
              {countedCash - expected === 0 ? "Khớp quỹ" : countedCash - expected > 0 ? `Thừa ${formatVnd(countedCash - expected)}` : `Thiếu ${formatVnd(expected - countedCash)}`}
            </Text>
          )}
          <Button mt="md" color="red" leftSection={<IconLock size={16} />} onClick={doClose} loading={busy}>
            Đóng ca
          </Button>
        </Card>
      ) : (
        <Card withBorder>
          <Group gap="xs" mb="sm"><IconCash size={20} /><Text fw={600}>Mở ca mới</Text></Group>
          <Stack>
            <TextInput label="Thu ngân" placeholder="Tên nhân viên" value={cashier} onChange={(e) => setCashier(e.currentTarget.value)} />
            <NumberInput label="Tiền đầu ca (₫)" min={0} step={100000} thousandSeparator="." decimalSeparator="," value={openingCash} onChange={(v) => setOpeningCash(Number(v) || 0)} />
            <Button color="teal" leftSection={<IconLockOpen size={16} />} onClick={doOpen} loading={busy}>Mở ca</Button>
          </Stack>
        </Card>
      )}

      <Text fw={600} mt="md">Lịch sử ca</Text>
      <Card p={0} withBorder>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Thu ngân</Table.Th>
              <Table.Th>Đóng lúc</Table.Th>
              <Table.Th ta="right">Đầu ca</Table.Th>
              <Table.Th ta="right">Kiểm kê</Table.Th>
              <Table.Th>Kết quả</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {history.length === 0 ? (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center" py="md">Chưa có ca đã đóng.</Text></Table.Td></Table.Tr>
            ) : history.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.cashier}</Table.Td>
                <Table.Td>{s.closedAt ? formatDateTime(s.closedAt) : "—"}</Table.Td>
                <Table.Td ta="right">{formatVnd(s.openingCash)}</Table.Td>
                <Table.Td ta="right">{s.countedCash != null ? formatVnd(s.countedCash) : "—"}</Table.Td>
                <Table.Td><Text size="sm">{s.note}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={strong ? 700 : 500}>{value}</Text>
    </Group>
  );
}
