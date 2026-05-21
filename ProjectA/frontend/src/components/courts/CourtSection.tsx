import { useState } from "react";
import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { Image } from "@mantine/core";
import { useCrudResource } from "../../hooks/useCrudResource";
import { courtService } from "../../services/courtService";
import type { Court, CourtStatus, CourtType } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { formatPriceRange } from "../../lib/pricing";
import { toMessage, notify } from "../../lib/notify";

const STATUS: Record<CourtStatus, { label: string; color: string }> = {
  available: { label: "Trống", color: "teal" },
  occupied: { label: "Đang dùng", color: "blue" },
  maintenance: { label: "Bảo trì", color: "orange" },
};

const TYPE_META: Record<CourtType, { label: string; color: string }> = {
  standard: { label: "Thường", color: "gray" },
  vip: { label: "VIP", color: "yellow" },
  competition: { label: "Thi đấu", color: "grape" },
};

// Mốc thời gian mỗi 30 phút, gồm cả "24:00" (hết ngày).
const TIME_OPTIONS = (() => {
  const arr: string[] = [];
  for (let m = 0; m <= 1440; m += 30) {
    arr.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
    );
  }
  return arr;
})();

type CourtForm = Omit<Court, "id">;

const emptyForm: CourtForm = {
  name: "",
  zone: "Khu A",
  type: "standard",
  imageUrl: "",
  status: "available",
  note: "",
  weekendSurcharge: 10,
  holidaySurcharge: 20,
  memberDiscount: 5,
  priceSlots: [
    { start: "05:00", end: "16:00", pricePerHour: 80000 },
    { start: "16:00", end: "22:00", pricePerHour: 130000 },
    { start: "22:00", end: "24:00", pricePerHour: 100000 },
  ],
};

export function CourtSection() {
  const { data, loading, create, update, remove } = useCrudResource(
    courtService,
    { created: "Đã thêm sân.", updated: "Đã cập nhật sân.", removed: "Đã xóa sân." }
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<CourtForm>({
    initialValues: emptyForm,
    validate: {
      name: (v) => (v.trim() ? null : "Nhập tên sân"),
      priceSlots: (v) =>
        v.length > 0 ? null : "Cần ít nhất một khung giá",
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm);
    open();
  };

  const openEdit = (court: Court) => {
    setEditingId(court.id);
    form.setValues({ ...court, note: court.note ?? "", imageUrl: court.imageUrl ?? "" });
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

  const columns: DataTableColumn<Court>[] = [
    {
      key: "name",
      header: "Sân",
      render: (c) => (
        <Group gap="sm" wrap="nowrap">
          <Image
            src={c.imageUrl}
            w={44}
            h={32}
            radius="sm"
            fallbackSrc="https://placehold.co/88x64?text=San"
            alt={c.name}
          />
          <Text fw={500}>{c.name}</Text>
        </Group>
      ),
    },
    { key: "zone", header: "Khu vực", render: (c) => c.zone },
    {
      key: "type",
      header: "Loại",
      render: (c) => (
        <Badge variant="light" color={TYPE_META[c.type].color}>
          {TYPE_META[c.type].label}
        </Badge>
      ),
    },
    {
      key: "price",
      header: "Giá theo giờ",
      align: "right",
      render: (c) => (
        <Tooltip
          multiline
          label={c.priceSlots
            .map((s) => `${s.start}–${s.end}: ${formatVnd(s.pricePerHour)}`)
            .join("\n")}
        >
          <Text size="sm" style={{ cursor: "help" }}>
            {formatPriceRange(c.priceSlots)}
          </Text>
        </Tooltip>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (c) => (
        <Badge variant="light" color={STATUS[c.status].color}>
          {STATUS[c.status].label}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      render: (c) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
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
        title="Sân cầu"
        subtitle="Quản lý sân và bảng giá theo khung giờ"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Thêm sân
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        rowKey={(c) => c.id}
        loading={loading}
        emptyTitle="Chưa có sân nào"
        emptyDescription="Thêm sân đầu tiên để bắt đầu quản lý."
      />

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? "Sửa sân" : "Thêm sân"}
        centered
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <Group grow>
              <TextInput label="Tên sân" required {...form.getInputProps("name")} />
              <Select
                label="Khu vực"
                data={["Khu A", "Khu B", "Khu VIP"]}
                {...form.getInputProps("zone")}
              />
            </Group>
            <Group grow>
              <Select
                label="Loại sân"
                data={[
                  { value: "standard", label: "Thường" },
                  { value: "vip", label: "VIP" },
                  { value: "competition", label: "Thi đấu" },
                ]}
                {...form.getInputProps("type")}
              />
              <Select
                label="Trạng thái"
                data={[
                  { value: "available", label: "Trống" },
                  { value: "occupied", label: "Đang dùng" },
                  { value: "maintenance", label: "Bảo trì" },
                ]}
                {...form.getInputProps("status")}
              />
            </Group>
            <TextInput
              label="Ảnh sân (URL)"
              placeholder="https://…"
              {...form.getInputProps("imageUrl")}
            />
            {form.values.imageUrl && (
              <Image src={form.values.imageUrl} h={120} radius="sm" fit="cover" alt="Xem trước ảnh sân" />
            )}

            <Divider label="Phụ thu & ưu đãi" labelPosition="left" mt="xs" />
            <Group grow>
              <NumberInput label="Phụ thu cuối tuần (%)" min={0} max={100} {...form.getInputProps("weekendSurcharge")} />
              <NumberInput label="Phụ thu ngày lễ (%)" min={0} max={100} {...form.getInputProps("holidaySurcharge")} />
              <NumberInput label="Giảm thành viên (%)" min={0} max={100} {...form.getInputProps("memberDiscount")} />
            </Group>

            <Divider
              label="Bảng giá theo khung giờ (giờ cao điểm)"
              labelPosition="left"
              mt="xs"
            />
            {form.values.priceSlots.map((_, i) => (
              <Group key={i} align="flex-end" wrap="nowrap" gap="xs">
                <Select
                  label={i === 0 ? "Từ" : undefined}
                  data={TIME_OPTIONS}
                  w={100}
                  {...form.getInputProps(`priceSlots.${i}.start`)}
                />
                <Select
                  label={i === 0 ? "Đến" : undefined}
                  data={TIME_OPTIONS}
                  w={100}
                  {...form.getInputProps(`priceSlots.${i}.end`)}
                />
                <NumberInput
                  label={i === 0 ? "Giá / giờ (₫)" : undefined}
                  min={0}
                  step={10000}
                  thousandSeparator="."
                  decimalSeparator=","
                  style={{ flex: 1 }}
                  {...form.getInputProps(`priceSlots.${i}.pricePerHour`)}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  mb={4}
                  onClick={() => form.removeListItem("priceSlots", i)}
                  disabled={form.values.priceSlots.length === 1}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            ))}
            {typeof form.errors.priceSlots === "string" && (
              <Text size="xs" c="red">
                {form.errors.priceSlots}
              </Text>
            )}
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() =>
                form.insertListItem("priceSlots", {
                  start: "00:00",
                  end: "00:00",
                  pricePerHour: 100000,
                })
              }
              style={{ alignSelf: "flex-start" }}
            >
              Thêm khung giờ
            </Button>

            <Textarea label="Ghi chú" autosize minRows={2} {...form.getInputProps("note")} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" loading={saving}>
                {editingId ? "Lưu" : "Thêm"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
