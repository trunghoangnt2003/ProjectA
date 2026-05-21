import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconPencil,
  IconEye,
  IconSearch,
  IconX,
  IconGift,
  IconBell,
  IconLock,
  IconLockOpen,
  IconKey,
  IconCoin,
} from "@tabler/icons-react";
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { STATUS_META } from "../bookings/bookingStatus";
import { useCrudResource } from "../../hooks/useCrudResource";
import { customerService } from "../../services/customerService";
import { bookingService } from "../../services/bookingService";
import type { Booking, Customer, CustomerTag } from "../../types/domain";
import { formatDate, formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const TAG_META: Record<CustomerTag, { label: string; color: string }> = {
  vip: { label: "VIP", color: "yellow" },
  frequent: { label: "Khách quen", color: "blue" },
  "bad-debt": { label: "Công nợ xấu", color: "red" },
  new: { label: "Khách mới", color: "teal" },
};
const TAG_OPTIONS = Object.entries(TAG_META).map(([value, m]) => ({ value, label: m.label }));

type CustomerForm = Omit<Customer, "id">;

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  tags: ["new"],
  loyaltyPoints: 0,
  debt: 0,
  note: "",
  locked: false,
  totalBookings: 0,
  joinedAt: new Date().toISOString().slice(0, 10),
};

export function CustomerSection() {
  const { data, loading, create, update, remove } = useCrudResource(
    customerService,
    { created: "Đã thêm khách hàng.", updated: "Đã cập nhật.", removed: "Đã xóa khách hàng." }
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<CustomerTag | "all">("all");

  // Drawer chi tiết
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);

  useEffect(() => {
    bookingService.list().then(setBookings).catch((e) => notify.error(toMessage(e)));
  }, []);

  const selected = useMemo(
    () => data.find((c) => c.id === selectedId) ?? null,
    [data, selectedId]
  );

  // Đồng bộ note nháp khi mở khách khác.
  useEffect(() => {
    setNoteDraft(selected?.note ?? "");
    setPointsToAdd(0);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const customerBookings = useMemo(() => {
    if (!selected) return [];
    return bookings
      .filter((b) => b.customerPhone === selected.phone)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [bookings, selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      if (tagFilter !== "all" && !c.tags.includes(tagFilter)) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !(c.email ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [data, search, tagFilter]);

  const form = useForm<CustomerForm>({
    initialValues: emptyForm,
    validate: {
      name: (v) => (v.trim() ? null : "Nhập tên khách"),
      phone: (v) => (/^\d{9,11}$/.test(v) ? null : "Số điện thoại không hợp lệ"),
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm);
    open();
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    form.setValues({ ...c, email: c.email ?? "", note: c.note ?? "" });
    open();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setSaving(true);
    try {
      if (editingId) await update(editingId, values);
      else await create(values);
      close();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  /** Cập nhật một phần thông tin khách (dùng cho các action ở drawer). */
  const patchCustomer = async (c: Customer, patch: Partial<CustomerForm>, ok: string) => {
    const { id, ...rest } = c;
    try {
      await update(id, { ...rest, ...patch });
      notify.success(ok);
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const toggleLock = (c: Customer) =>
    patchCustomer(
      c,
      { locked: !c.locked },
      c.locked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản."
    );

  const collectDebt = (c: Customer) =>
    patchCustomer(
      c,
      { debt: 0, tags: c.tags.filter((t) => t !== "bad-debt") },
      "Đã ghi nhận thanh toán công nợ."
    );

  const addPoints = (c: Customer) => {
    if (pointsToAdd <= 0) return;
    patchCustomer(c, { loyaltyPoints: c.loyaltyPoints + pointsToAdd }, `Đã cộng ${pointsToAdd} điểm.`);
    setPointsToAdd(0);
  };

  const saveNote = (c: Customer) =>
    patchCustomer(c, { note: noteDraft.trim() || undefined }, "Đã lưu ghi chú.");

  const hasFilter = search.trim() !== "" || tagFilter !== "all";

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Khách hàng",
      render: (c) => (
        <div>
          <Group gap={6} wrap="nowrap">
            <Text fw={500}>{c.name}</Text>
            {c.locked && (
              <Badge size="xs" color="red" variant="light" leftSection={<IconLock size={10} />}>
                Khóa
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">{c.phone}{c.email ? ` · ${c.email}` : ""}</Text>
        </div>
      ),
    },
    {
      key: "tags",
      header: "Phân loại",
      render: (c) =>
        c.tags.length ? (
          <Group gap={4}>
            {c.tags.map((t) => (
              <Badge key={t} size="sm" variant="light" color={TAG_META[t].color}>
                {TAG_META[t].label}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text c="dimmed" size="sm">—</Text>
        ),
    },
    { key: "points", header: "Điểm", align: "right", render: (c) => c.loyaltyPoints.toLocaleString("vi-VN") },
    {
      key: "debt",
      header: "Công nợ",
      align: "right",
      render: (c) =>
        c.debt > 0 ? <Text c="red" fw={600}>{formatVnd(c.debt)}</Text> : <Text c="dimmed">—</Text>,
    },
    { key: "bookings", header: "Lượt đặt", align: "right", render: (c) => c.totalBookings },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 130,
      render: (c) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Hồ sơ khách">
            <ActionIcon variant="subtle" onClick={() => setSelectedId(c.id)}>
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Sửa">
            <ActionIcon variant="subtle" onClick={() => openEdit(c)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <ConfirmDeleteButton itemLabel={c.name} onConfirm={() => remove(c.id)} />
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Khách hàng"
        subtitle="Hồ sơ khách, lịch sử đặt sân, điểm tích lũy & công nợ"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Thêm khách hàng
          </Button>
        }
      />

      <Card mb="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Tìm kiếm"
            placeholder="Tên, SĐT hoặc email…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <MultiSelect
            label="Phân loại"
            placeholder="Tất cả"
            w={220}
            clearable
            data={TAG_OPTIONS}
            value={tagFilter === "all" ? [] : [tagFilter]}
            onChange={(v) => setTagFilter((v[v.length - 1] as CustomerTag) ?? "all")}
          />
          {hasFilter && (
            <Button variant="subtle" color="gray" leftSection={<IconX size={16} />} onClick={() => { setSearch(""); setTagFilter("all"); }}>
              Xóa lọc
            </Button>
          )}
        </Group>
      </Card>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        loading={loading}
        emptyTitle={hasFilter ? "Không có khách khớp bộ lọc" : "Chưa có khách hàng nào"}
      />

      {/* Hồ sơ khách */}
      <Drawer
        opened={selected !== null}
        onClose={() => setSelectedId(null)}
        position="right"
        size="lg"
        title={selected ? `Hồ sơ · ${selected.name}` : ""}
      >
        {selected && (
          <Stack>
            <Group gap="xs">
              {selected.tags.map((t) => (
                <Badge key={t} variant="light" color={TAG_META[t].color}>
                  {TAG_META[t].label}
                </Badge>
              ))}
              {selected.locked && (
                <Badge color="red" variant="filled" leftSection={<IconLock size={12} />}>
                  Đã khóa
                </Badge>
              )}
            </Group>

            <SimpleGrid cols={2} spacing="xs">
              <Info label="Điện thoại" value={selected.phone} />
              <Info label="Email" value={selected.email || "—"} />
              <Info label="Tham gia" value={formatDate(selected.joinedAt)} />
              <Info label="Tổng lượt đặt" value={String(selected.totalBookings)} />
              <Info label="Điểm tích lũy" value={selected.loyaltyPoints.toLocaleString("vi-VN")} />
              <Info
                label="Công nợ"
                value={selected.debt > 0 ? formatVnd(selected.debt) : "Không"}
                danger={selected.debt > 0}
              />
            </SimpleGrid>

            <Divider label="Hành động" labelPosition="left" />
            <Group gap="xs">
              <Button size="xs" variant="light" leftSection={<IconGift size={14} />} onClick={() => notify.success(`Đã gửi voucher cho ${selected.name}.`)}>
                Gửi voucher
              </Button>
              <Button size="xs" variant="light" leftSection={<IconBell size={14} />} onClick={() => notify.success(`Đã gửi thông báo cho ${selected.name}.`)}>
                Gửi thông báo
              </Button>
              <Button size="xs" variant="light" color="gray" leftSection={<IconKey size={14} />} onClick={() => notify.success("Đã gửi liên kết đặt lại mật khẩu.")}>
                Reset mật khẩu
              </Button>
              <Button
                size="xs"
                variant="light"
                color={selected.locked ? "teal" : "red"}
                leftSection={selected.locked ? <IconLockOpen size={14} /> : <IconLock size={14} />}
                onClick={() => toggleLock(selected)}
              >
                {selected.locked ? "Mở khóa" : "Khóa tài khoản"}
              </Button>
            </Group>

            {selected.debt > 0 && (
              <Card withBorder p="sm" bg="var(--mantine-color-red-0)">
                <Group justify="space-between">
                  <Text size="sm">Công nợ hiện tại: <b>{formatVnd(selected.debt)}</b></Text>
                  <Button size="xs" color="red" variant="light" leftSection={<IconCoin size={14} />} onClick={() => collectDebt(selected)}>
                    Đã thu nợ
                  </Button>
                </Group>
              </Card>
            )}

            <Group align="flex-end" gap="xs">
              <NumberInput
                label="Cộng điểm tích lũy"
                min={0}
                step={50}
                value={pointsToAdd}
                onChange={(v) => setPointsToAdd(Number(v) || 0)}
                style={{ flex: 1 }}
              />
              <Button variant="light" onClick={() => addPoints(selected)} disabled={pointsToAdd <= 0}>
                Cộng điểm
              </Button>
            </Group>

            <Textarea
              label="Ghi chú nội bộ"
              autosize
              minRows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button size="xs" variant="default" onClick={() => saveNote(selected)}>
                Lưu ghi chú
              </Button>
            </Group>

            <Divider label="Lịch sử đặt sân" labelPosition="left" />
            {customerBookings.length === 0 ? (
              <Text size="sm" c="dimmed">Chưa có lượt đặt nào.</Text>
            ) : (
              <Table verticalSpacing="xs" striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ngày</Table.Th>
                    <Table.Th>Sân</Table.Th>
                    <Table.Th>Giờ</Table.Th>
                    <Table.Th>Trạng thái</Table.Th>
                    <Table.Th ta="right">Tiền</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {customerBookings.map((b) => (
                    <Table.Tr key={b.id}>
                      <Table.Td>{formatDate(b.date)}</Table.Td>
                      <Table.Td>{b.courtName}</Table.Td>
                      <Table.Td>{b.startTime}–{b.endTime}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color={STATUS_META[b.status].color}>
                          {STATUS_META[b.status].label}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">{formatVnd(b.totalPrice)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Tạo / sửa */}
      <Modal opened={opened} onClose={close} title={editingId ? "Sửa khách hàng" : "Thêm khách hàng"} centered>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Họ tên" required {...form.getInputProps("name")} />
            <TextInput label="Số điện thoại" required {...form.getInputProps("phone")} />
            <TextInput label="Email" type="email" {...form.getInputProps("email")} />
            <MultiSelect
              label="Phân loại"
              data={TAG_OPTIONS}
              value={form.values.tags}
              onChange={(v) => form.setFieldValue("tags", v as CustomerTag[])}
            />
            <Group grow>
              <NumberInput label="Điểm tích lũy" min={0} {...form.getInputProps("loyaltyPoints")} />
              <NumberInput
                label="Công nợ (₫)"
                min={0}
                step={10000}
                thousandSeparator="."
                decimalSeparator=","
                {...form.getInputProps("debt")}
              />
            </Group>
            <Textarea label="Ghi chú" autosize minRows={2} {...form.getInputProps("note")} />
            <Switch
              label="Khóa tài khoản"
              {...form.getInputProps("locked", { type: "checkbox" })}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
              <Button type="submit" loading={saving}>{editingId ? "Lưu" : "Thêm"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

function Info({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={500} c={danger ? "red" : undefined}>{value}</Text>
    </div>
  );
}
