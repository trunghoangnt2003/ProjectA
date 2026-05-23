import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil, IconDiscount2, IconClock, IconTicket, IconSearch } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { usePagedResource } from "../../hooks/usePagedResource";
import { promotionService } from "../../services/promotionService";
import type { Promotion, PromotionType } from "../../types/domain";
import { formatVnd, formatDate } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const TYPE_META: Record<PromotionType, { label: string; color: string }> = {
  percentage: { label: "Giảm %", color: "blue" },
  fixed: { label: "Giảm tiền", color: "teal" },
  "free-service": { label: "Tặng dịch vụ", color: "grape" },
  cashback: { label: "Hoàn tiền", color: "orange" },
};

const todayIso = new Date().toISOString().slice(0, 10);

type PromotionForm = Omit<Promotion, "id">;

const emptyForm: PromotionForm = {
  code: "",
  name: "",
  type: "percentage",
  value: 10,
  description: "",
  startDate: "",
  endDate: "",
  timeStart: "",
  timeEnd: "",
  minOrder: 0,
  maxUses: 0,
  usedCount: 0,
  active: true,
};

function valueText(p: Promotion): string {
  if (p.type === "percentage") return `${p.value}%`;
  if (p.type === "free-service") return "Tặng dịch vụ";
  return formatVnd(p.value);
}

function validityText(p: Promotion): string {
  if (p.timeStart && p.timeEnd) return `${p.timeStart}–${p.timeEnd} hằng ngày`;
  if (p.startDate || p.endDate)
    return `${p.startDate ? formatDate(p.startDate) : "…"} – ${p.endDate ? formatDate(p.endDate) : "…"}`;
  return "Không giới hạn";
}

const isExpired = (p: Promotion) => !!p.endDate && p.endDate < todayIso;

export function PromotionSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, create, update, remove, search, setSearch, page, setPage, totalPages, totalCount } = usePagedResource(
    promotionService,
    {},
    {
      created: "Đã tạo khuyến mãi.",
      updated: "Đã cập nhật.",
      removed: "Đã xóa khuyến mãi.",
    }
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<PromotionForm>({
    initialValues: emptyForm,
    validate: {
      code: (v) => (v.trim() ? null : "Nhập mã khuyến mãi"),
      name: (v) => (v.trim() ? null : "Nhập tên chương trình"),
    },
  });

  const stats = useMemo(() => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const soonIso = soon.toISOString().slice(0, 10);
    return {
      active: data.filter((p) => p.active && !isExpired(p)).length,
      expiringSoon: data.filter((p) => p.active && p.endDate && p.endDate >= todayIso && p.endDate <= soonIso).length,
      totalUsed: data.reduce((s, p) => s + p.usedCount, 0),
    };
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    form.setValues({ ...emptyForm, code: "" });
    open();
  };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    form.setValues({
      ...emptyForm,
      ...p,
      description: p.description ?? "",
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
      timeStart: p.timeStart ?? "",
      timeEnd: p.timeEnd ?? "",
      minOrder: p.minOrder ?? 0,
      maxUses: p.maxUses ?? 0,
    });
    open();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    // Dọn các field rỗng về undefined cho sạch dữ liệu.
    const payload: PromotionForm = {
      ...values,
      code: values.code.trim().toUpperCase(),
      description: values.description?.trim() || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      timeStart: values.timeStart || undefined,
      timeEnd: values.timeEnd || undefined,
      minOrder: values.minOrder || undefined,
      maxUses: values.maxUses || undefined,
      value: values.type === "free-service" ? 0 : values.value,
    };
    setSaving(true);
    try {
      if (editingId) await update(editingId, payload);
      else await create(payload);
      close();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  const toggleActive = async (p: Promotion) => {
    const { id, ...rest } = p;
    try {
      await update(id, { ...rest, active: !p.active });
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const columns: DataTableColumn<Promotion>[] = [
    {
      key: "code",
      header: "Mã / Tên",
      render: (p) => (
        <div>
          <Group gap={6}>
            <Text fw={700} ff="monospace">{p.code}</Text>
            {isExpired(p) && <Badge size="xs" color="red" variant="light">Hết hạn</Badge>}
          </Group>
          <Text size="xs" c="dimmed">{p.name}</Text>
        </div>
      ),
    },
    {
      key: "type",
      header: "Loại",
      render: (p) => <Badge variant="light" color={TYPE_META[p.type].color}>{TYPE_META[p.type].label}</Badge>,
    },
    { key: "value", header: "Ưu đãi", align: "right", render: (p) => <Text fw={600}>{valueText(p)}</Text> },
    { key: "validity", header: "Hiệu lực", render: (p) => <Text size="sm">{validityText(p)}</Text> },
    {
      key: "usage",
      header: "Lượt dùng",
      align: "right",
      render: (p) => (p.maxUses ? `${p.usedCount}/${p.maxUses}` : p.usedCount),
    },
    {
      key: "active",
      header: "Bật",
      render: (p) => <Switch checked={p.active} onChange={() => toggleActive(p)} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      render: (p) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Sửa">
            <ActionIcon variant="subtle" onClick={() => openEdit(p)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <ConfirmDeleteButton itemLabel={p.code} onConfirm={() => remove(p.id)} />
        </Group>
      ),
    },
  ];

  const showValue = form.values.type !== "free-service";

  return (
    <>
      <PageHeader
        title="Khuyến mãi"
        subtitle="Voucher, mã giảm giá, happy hours & hoàn tiền"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Tạo khuyến mãi
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard label="Đang hoạt động" value={stats.active} icon={<IconTicket size={26} />} color="teal" />
        <StatCard label="Sắp hết hạn (7 ngày)" value={stats.expiringSoon} icon={<IconClock size={26} />} color="orange" />
        <StatCard label="Tổng lượt dùng" value={stats.totalUsed} icon={<IconDiscount2 size={26} />} color="brand" />
      </SimpleGrid>

      <Card mb="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Tìm kiếm"
            placeholder="Mã hoặc tên khuyến mãi..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchQuery);
            }}
            onBlur={() => setSearch(searchQuery)}
            style={{ flex: 1, minWidth: 220 }}
          />
        </Group>
      </Card>

      <DataTable
        data={data}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        emptyTitle="Chưa có khuyến mãi nào"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      <Modal opened={opened} onClose={close} title={editingId ? "Sửa khuyến mãi" : "Tạo khuyến mãi"} centered>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Group grow>
              <TextInput label="Mã" required placeholder="SUMMER10" {...form.getInputProps("code")} />
              <Select
                label="Loại"
                data={Object.entries(TYPE_META).map(([value, m]) => ({ value, label: m.label }))}
                {...form.getInputProps("type")}
              />
            </Group>
            <TextInput label="Tên chương trình" required {...form.getInputProps("name")} />
            {showValue && (
              <NumberInput
                label={form.values.type === "percentage" ? "Giá trị (%)" : "Giá trị (₫)"}
                min={0}
                step={form.values.type === "percentage" ? 1 : 10000}
                thousandSeparator={form.values.type === "percentage" ? undefined : "."}
                decimalSeparator=","
                {...form.getInputProps("value")}
              />
            )}
            <Textarea label="Mô tả" autosize minRows={2} {...form.getInputProps("description")} />
            <Group grow>
              <TextInput label="Hiệu lực từ" type="date" {...form.getInputProps("startDate")} />
              <TextInput label="Đến" type="date" {...form.getInputProps("endDate")} />
            </Group>
            <Group grow>
              <TextInput label="Happy hours từ" type="time" {...form.getInputProps("timeStart")} />
              <TextInput label="Đến" type="time" {...form.getInputProps("timeEnd")} />
            </Group>
            <Group grow>
              <NumberInput label="Đơn tối thiểu (₫)" min={0} step={50000} thousandSeparator="." decimalSeparator="," {...form.getInputProps("minOrder")} />
              <NumberInput label="Giới hạn lượt (0 = ∞)" min={0} {...form.getInputProps("maxUses")} />
            </Group>
            <Switch label="Kích hoạt" {...form.getInputProps("active", { type: "checkbox" })} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
              <Button type="submit" loading={saving}>{editingId ? "Lưu" : "Tạo"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
