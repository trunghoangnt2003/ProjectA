import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Divider, Group, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import { IconLockOpen, IconLock, IconCash } from "@tabler/icons-react";
import { cashierShiftService } from "../../services/cashierShiftService";
import { orderService } from "../../services/orderService";
import type { CashierShift, Order } from "../../types/domain";
import { formatVnd, formatDateTime } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";
import { usePagedResource } from "../../hooks/usePagedResource";
import { DataTable } from "../common";
import type { DataTableColumn } from "../common";

/** Tổng tiền bán hàng phát sinh trong khoảng [from, to]. */
function salesBetween(orders: Order[], fromIso: string, toIso: string): number {
  return orders
    .filter((o) => o.createdAt >= fromIso && o.createdAt <= toIso)
    .reduce((s, o) => s + o.total, 0);
}

export function CashierShiftScreen() {
  const { data: shifts, loading, create, update, page, setPage, totalPages, totalCount } = usePagedResource(
    cashierShiftService,
    { created: "Đã mở ca.", updated: "Đã đóng ca." }
  );
  
  const [liveSales, setLiveSales] = useState(0);
  const [cashier, setCashier] = useState("");
  const [openingCash, setOpeningCash] = useState(1000000);
  const [countedCash, setCountedCash] = useState(0);
  const [busy, setBusy] = useState(false);

  const openShift = useMemo(() => shifts.find((s) => s.status === "open"), [shifts]);
  const history = useMemo(
    () => shifts.filter((s) => s.status === "closed").sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? "")),
    [shifts]
  );

  useEffect(() => {
    if (openShift) {
      orderService.getAll({ startDate: openShift.openedAt.slice(0, 10), pageSize: 1000 })
        .then(res => {
          const total = res.items
            .filter((o) => o.createdAt >= openShift.openedAt)
            .reduce((s, o) => s + o.total, 0);
          setLiveSales(total);
        })
        .catch(console.error);
    } else {
      setLiveSales(0);
    }
  }, [openShift]);

  const expected = openShift ? openShift.openingCash + liveSales : 0;

  const doOpen = async () => {
    if (!cashier.trim()) return notify.error("Nhập tên thu ngân.");
    setBusy(true);
    try {
      await create({
        cashier: cashier.trim(),
        openedAt: new Date().toISOString(),
        openingCash,
        status: "open",
      });
      setCashier("");
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
      await update(id, {
        ...rest,
        status: "closed",
        closedAt: new Date().toISOString(),
        countedCash,
        note: diff === 0 ? "Khớp quỹ." : diff > 0 ? `Thừa ${formatVnd(diff)}` : `Thiếu ${formatVnd(-diff)}`,
      });
      setCountedCash(0);
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const historyColumns: DataTableColumn<CashierShift>[] = [
    { key: "cashier", header: "Thu ngân", render: (s) => s.cashier },
    { key: "closedAt", header: "Đóng lúc", render: (s) => s.closedAt ? formatDateTime(s.closedAt) : "—" },
    { key: "openingCash", header: "Đầu ca", align: "right", render: (s) => formatVnd(s.openingCash) },
    { key: "countedCash", header: "Kiểm kê", align: "right", render: (s) => s.countedCash != null ? formatVnd(s.countedCash) : "—" },
    { key: "note", header: "Kết quả", render: (s) => <Text size="sm">{s.note}</Text> },
  ];

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
      <DataTable
        data={history}
        columns={historyColumns}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle="Chưa có ca đã đóng."
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />
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
