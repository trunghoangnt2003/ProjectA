import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconArrowBackUp, IconClockHour4, IconCoin } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { rentalService } from "../../services/rentalService";
import { supplyService } from "../../services/supplyService";
import { orderService } from "../../services/orderService";
import type { Rental, RentalStatus, Supply } from "../../types/domain";
import { formatVnd, formatDateTime, formatDate } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

/** Cọc mặc định cho một lượt thuê = 1/2 giá trị món × số lượng. */
const suggestedDeposit = (item: Supply | undefined, qty: number) =>
  Math.round(((item?.rentalValue ?? 0) / 2) * Math.max(qty, 0));

const STATUS_META: Record<RentalStatus, { label: string; color: string }> = {
  borrowed: { label: "Đang mượn", color: "blue" },
  returned: { label: "Đã trả", color: "teal" },
};

/** Vật tư cho thuê = vật tư sân nhóm Vợt / Giày đã cấu hình giá thuê. */
const isRentable = (s: Supply) =>
  !s.forSale && (s.category === "Vợt" || s.category === "Giày") && s.rentalPrice != null;

interface RentForm {
  itemId: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
  deposit: number;
  dueAt: string;
  note: string;
}

import { usePagedResource } from "../../hooks/usePagedResource";

export function RentalSection() {
  const { data: rentals, loading, create, update, page, totalPages, totalCount, setPage, reload } = usePagedResource(rentalService, {}, {
    created: "Đã cho thuê.",
    updated: "Đã nhận trả.",
  });
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "all">("all");
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supplyService.list().then(setSupplies).catch((e) => notify.error(toMessage(e)));
  }, []);

  const rentables = useMemo(() => supplies.filter(isRentable), [supplies]);

  const view = useMemo(
    () =>
      rentals
        .filter((r) => statusFilter === "all" || r.status === statusFilter)
        .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt)),
    [rentals, statusFilter]
  );

  const stats = useMemo(() => {
    const borrowed = rentals.filter((r) => r.status === "borrowed");
    return {
      borrowedCount: borrowed.reduce((s, r) => s + r.quantity, 0),
      depositHeld: borrowed.reduce((s, r) => s + r.deposit, 0),
      feeTotal: rentals.reduce((s, r) => s + (r.fee ?? 0), 0),
    };
  }, [rentals]);

  const form = useForm<RentForm>({
    initialValues: {
      itemId: "", customerName: "", customerPhone: "", quantity: 1, deposit: 0,
      dueAt: new Date().toISOString().slice(0, 10), note: "",
    },
    validate: {
      itemId: (v) => (v ? null : "Chọn vật tư cho thuê"),
      customerName: (v) => (v.trim() ? null : "Nhập tên khách"),
      quantity: (v) => (v > 0 ? null : "Số lượng phải > 0"),
    },
  });

  const openRent = () => {
    form.setValues({
      itemId: "", customerName: "", customerPhone: "", quantity: 1, deposit: 0,
      dueAt: new Date().toISOString().slice(0, 10), note: "",
    });
    open();
  };

  const submitRent = form.onSubmit(async (values) => {
    const item = rentables.find((s) => s.id === values.itemId);
    if (!item) return;
    if (values.quantity > item.quantity) {
      notify.error(`Chỉ còn ${item.quantity} ${item.unit} để cho thuê.`);
      return;
    }
    const fee = (item.rentalPrice ?? 0) * values.quantity;
    const now = new Date().toISOString();
    setSaving(true);
    try {
      // Trừ tồn vật tư.
      const { id, ...rest } = item;
      await supplyService.update(id, { ...rest, quantity: item.quantity - values.quantity });
      await rentalService.create({
        code: "TH-" + Math.floor(5000 + Math.random() * 4000),
        itemId: item.id,
        itemName: item.name,
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim() || undefined,
        quantity: values.quantity,
        fee,
        deposit: values.deposit,
        borrowedAt: now,
        dueAt: values.dueAt || undefined,
        status: "borrowed",
        note: values.note.trim() || undefined,
      });
      // Tiền thuê tính vào doanh thu → tạo hóa đơn (cọc lưu riêng, không tính doanh thu).
      if (fee > 0) {
        await orderService.create({
          code: "HD-" + Math.floor(1000 + Math.random() * 9000),
          createdAt: now,
          customerName: values.customerName.trim() || undefined,
          lines: [
            {
              refId: item.id,
              source: "rental",
              name: `Thuê ${item.name}`,
              unitPrice: item.rentalPrice ?? 0,
              quantity: values.quantity,
            },
          ],
          total: fee,
          deposit: values.deposit || undefined,
        });
      }
      notify.success(`Đã cho thuê · thu ${formatVnd(fee)}, giữ cọc ${formatVnd(values.deposit)}.`);
      close();
      reload();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  const returnRental = async (r: Rental) => {
    try {
      // Hoàn tồn vật tư.
      const item = supplies.find((s) => s.id === r.itemId);
      if (item) {
        const { id, ...rest } = item;
        await supplyService.update(id, { ...rest, quantity: item.quantity + r.quantity });
      }
      const { id, ...rest } = r;
      await rentalService.returnRental(id);
      notify.success(`Đã nhận trả, hoàn cọc ${formatVnd(r.deposit)}.`);
      reload();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const columns: DataTableColumn<Rental>[] = [
    { key: "code", header: "Mã", render: (r) => <Text fw={600}>{r.code}</Text> },
    { key: "item", header: "Vật tư", render: (r) => `${r.quantity}× ${r.itemName}` },
    {
      key: "customer",
      header: "Khách",
      render: (r) => (
        <div>
          <Text size="sm">{r.customerName}</Text>
          {r.customerPhone && <Text size="xs" c="dimmed">{r.customerPhone}</Text>}
        </div>
      ),
    },
    {
      key: "fee",
      header: "Tiền thuê",
      align: "right",
      render: (r) => <Text fw={600} c="brand">{formatVnd(r.fee ?? 0)}</Text>,
    },
    { key: "deposit", header: "Cọc", align: "right", render: (r) => formatVnd(r.deposit) },
    {
      key: "time",
      header: "Mượn / Hạn",
      render: (r) => (
        <div>
          <Text size="xs">{formatDateTime(r.borrowedAt)}</Text>
          {r.dueAt && <Text size="xs" c="dimmed">Hạn: {formatDate(r.dueAt)}</Text>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => (
        <Badge variant="light" color={STATUS_META[r.status].color}>
          {STATUS_META[r.status].label}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 110,
      render: (r) =>
        r.status === "borrowed" ? (
          <Button size="xs" variant="light" leftSection={<IconArrowBackUp size={14} />} onClick={() => returnRental(r)}>
            Nhận trả
          </Button>
        ) : (
          <Text size="xs" c="dimmed">{r.returnedAt ? formatDate(r.returnedAt) : "—"}</Text>
        ),
    },
  ];

  const selectedItem = rentables.find((s) => s.id === form.values.itemId);

  return (
    <>
      <PageHeader
        title="Thuê đồ"
        subtitle="Cho thuê vợt / giày — đặt cọc, mượn & trả"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openRent}>
            Cho thuê
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard label="Đang cho mượn" value={stats.borrowedCount} icon={<IconClockHour4 size={26} />} color="blue" />
        <StatCard label="Tiền cọc đang giữ" value={formatVnd(stats.depositHeld)} icon={<IconCoin size={26} />} color="grape" />
        <StatCard label="Doanh thu thuê đồ" value={formatVnd(stats.feeTotal)} icon={<IconCoin size={26} />} color="teal" />
      </SimpleGrid>

      <Card mb="md" p="md">
        <Select
          label="Trạng thái"
          w={180}
          value={statusFilter}
          onChange={(v) => setStatusFilter((v as RentalStatus | "all") ?? "all")}
          data={[
            { value: "all", label: "Tất cả" },
            { value: "borrowed", label: "Đang mượn" },
            { value: "returned", label: "Đã trả" },
          ]}
        />
      </Card>

      <DataTable
        data={view}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="Chưa có lượt thuê nào"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      <Modal opened={opened} onClose={close} title="Cho thuê vật tư" centered>
        <form onSubmit={submitRent}>
          <Stack>
            <Select
              label="Vật tư cho thuê"
              required
              searchable
              placeholder="Chọn vợt / giày"
              data={rentables.map((s) => ({
                value: s.id,
                label: `${s.name} · còn ${s.quantity} ${s.unit}`,
              }))}
              value={form.values.itemId || null}
              onChange={(v) => {
                form.setFieldValue("itemId", v ?? "");
                const item = rentables.find((s) => s.id === v);
                form.setFieldValue("deposit", suggestedDeposit(item, form.values.quantity));
              }}
              error={form.errors.itemId}
            />
            <TextInput label="Tên khách" required {...form.getInputProps("customerName")} />
            <TextInput label="Số điện thoại" {...form.getInputProps("customerPhone")} />
            <Group grow>
              <NumberInput
                label="Số lượng"
                min={1}
                max={selectedItem?.quantity}
                value={form.values.quantity}
                onChange={(v) => {
                  const qty = Number(v) || 1;
                  form.setFieldValue("quantity", qty);
                  form.setFieldValue("deposit", suggestedDeposit(selectedItem, qty));
                }}
                error={form.errors.quantity}
              />
              <NumberInput
                label="Tiền cọc (₫)"
                description="Mặc định 1/2 giá trị món"
                min={0}
                step={50000}
                thousandSeparator="."
                decimalSeparator=","
                {...form.getInputProps("deposit")}
              />
            </Group>
            {selectedItem && (
              <Text size="sm" c="dimmed">
                Tiền thuê:{" "}
                <Text span fw={600} c="brand">
                  {formatVnd((selectedItem.rentalPrice ?? 0) * form.values.quantity)}
                </Text>{" "}
                ({formatVnd(selectedItem.rentalPrice ?? 0)}/lượt × {form.values.quantity}) · tính vào
                doanh thu. Cọc hoàn khi khách trả đồ.
              </Text>
            )}
            <TextInput label="Hạn trả" type="date" {...form.getInputProps("dueAt")} />
            <TextInput label="Ghi chú" {...form.getInputProps("note")} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
              <Button type="submit" loading={saving}>Cho thuê</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
