import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil } from "@tabler/icons-react";
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { useCrudResource } from "../../hooks/useCrudResource";
import { supplyService } from "../../services/supplyService";
import type { Supply } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const CATEGORIES = ["Cầu", "Cước", "Vợt", "Lưới", "Giày", "Phụ kiện", "Khác"];
const UNITS = ["ống", "cuộn", "cây", "cái", "đôi", "bộ", "hộp"];
/** Nhóm vật tư có thể cho thuê (vợt/giày). */
const RENTABLE_CATEGORIES = ["Vợt", "Giày"];

type SaleFilter = "all" | "sale" | "court";

type SupplyForm = Omit<Supply, "id">;

const emptyForm: SupplyForm = {
  name: "",
  category: "Cầu",
  quantity: 0,
  unit: "ống",
  reorderLevel: 5,
  forSale: false,
  salePrice: undefined,
  rentalPrice: undefined,
  rentalValue: undefined,
};

export function SupplySection() {
  const { data, loading, create, update, remove } = useCrudResource(
    supplyService,
    { created: "Đã thêm vật tư.", updated: "Đã cập nhật.", removed: "Đã xóa vật tư." }
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SaleFilter>("all");

  const form = useForm<SupplyForm>({
    initialValues: emptyForm,
    validate: {
      name: (v) => (v.trim() ? null : "Nhập tên vật tư"),
      salePrice: (v, values) =>
        values.forSale && !(v && v > 0) ? "Vật tư bán cần có giá bán" : null,
      rentalPrice: (v, values) =>
        !values.forSale && RENTABLE_CATEGORIES.includes(values.category) && !(v && v > 0)
          ? "Vật tư cho thuê cần có giá thuê"
          : null,
      rentalValue: (v, values) =>
        !values.forSale && RENTABLE_CATEGORIES.includes(values.category) && !(v && v > 0)
          ? "Nhập giá trị món đồ (để tính cọc)"
          : null,
    },
  });

  /** Vật tư sân thuộc nhóm cho thuê → hiện cấu hình giá thuê & cọc. */
  const isRentable =
    !form.values.forSale && RENTABLE_CATEGORIES.includes(form.values.category);

  const filtered = useMemo(
    () =>
      data.filter((s) =>
        typeFilter === "all"
          ? true
          : typeFilter === "sale"
            ? s.forSale
            : !s.forSale
      ),
    [data, typeFilter]
  );

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm);
    open();
  };

  const openEdit = (s: Supply) => {
    setEditingId(s.id);
    form.setValues({ ...s });
    open();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const rentable = !values.forSale && RENTABLE_CATEGORIES.includes(values.category);
    // Vật tư bán: bỏ trường thuê. Vật tư sân: bỏ giá bán. Vật tư không cho thuê: bỏ trường thuê.
    const payload: SupplyForm = {
      ...values,
      salePrice: values.forSale ? values.salePrice : undefined,
      rentalPrice: rentable ? values.rentalPrice : undefined,
      rentalValue: rentable ? values.rentalValue : undefined,
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

  const columns: DataTableColumn<Supply>[] = [
    { key: "name", header: "Tên vật tư", render: (s) => <Text fw={500}>{s.name}</Text> },
    { key: "category", header: "Loại", render: (s) => s.category },
    {
      key: "type",
      header: "Phân loại",
      render: (s) =>
        s.forSale ? (
          <Badge variant="light" color="grape">
            Vật tư bán
          </Badge>
        ) : (
          <Badge variant="light" color="gray">
            Vật tư sân
          </Badge>
        ),
    },
    {
      key: "salePrice",
      header: "Giá bán / thuê",
      align: "right",
      render: (s) => {
        if (s.forSale && s.salePrice) return formatVnd(s.salePrice);
        if (!s.forSale && s.rentalPrice)
          return (
            <div>
              <Text size="sm">{formatVnd(s.rentalPrice)}/lượt</Text>
              {s.rentalValue ? (
                <Text size="xs" c="dimmed">Cọc {formatVnd(Math.round(s.rentalValue / 2))}</Text>
              ) : null}
            </div>
          );
        return "—";
      },
    },
    {
      key: "quantity",
      header: "Tồn",
      align: "right",
      render: (s) => `${s.quantity} ${s.unit}`,
    },
    {
      key: "status",
      header: "Tình trạng",
      render: (s) =>
        s.quantity <= s.reorderLevel ? (
          <Badge variant="light" color="orange">
            Cần nhập thêm
          </Badge>
        ) : (
          <Badge variant="light" color="teal">
            Đủ
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      render: (s) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Sửa">
            <ActionIcon variant="subtle" onClick={() => openEdit(s)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <ConfirmDeleteButton itemLabel={s.name} onConfirm={() => remove(s.id)} />
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Vật tư"
        subtitle="Vật tư bán cho khách và vật tư phục vụ sân"
        actions={
          <>
            <SegmentedControl
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as SaleFilter)}
              data={[
                { value: "all", label: "Tất cả" },
                { value: "sale", label: "Vật tư bán" },
                { value: "court", label: "Vật tư sân" },
              ]}
            />
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              Thêm vật tư
            </Button>
          </>
        }
      />

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle="Chưa có vật tư nào"
      />

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? "Sửa vật tư" : "Thêm vật tư"}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Tên vật tư" required {...form.getInputProps("name")} />
            <Select label="Loại" data={CATEGORIES} {...form.getInputProps("category")} />
            <Group grow>
              <NumberInput label="Số lượng tồn" min={0} {...form.getInputProps("quantity")} />
              <Select label="Đơn vị" data={UNITS} {...form.getInputProps("unit")} />
            </Group>
            <NumberInput
              label="Ngưỡng cảnh báo nhập thêm"
              min={0}
              {...form.getInputProps("reorderLevel")}
            />
            <Switch
              label="Vật tư bán (bán cho khách qua màn Bán hàng)"
              checked={form.values.forSale}
              onChange={(e) => form.setFieldValue("forSale", e.currentTarget.checked)}
            />
            {form.values.forSale && (
              <NumberInput
                label="Giá bán (₫)"
                required
                min={0}
                step={1000}
                thousandSeparator="."
                decimalSeparator=","
                {...form.getInputProps("salePrice")}
              />
            )}
            {isRentable && (
              <>
                <Group grow align="flex-start">
                  <NumberInput
                    label="Giá thuê (₫/lượt)"
                    required
                    min={0}
                    step={5000}
                    thousandSeparator="."
                    decimalSeparator=","
                    {...form.getInputProps("rentalPrice")}
                  />
                  <NumberInput
                    label="Giá trị món đồ (₫)"
                    description="Cọc = 1/2 giá trị"
                    required
                    min={0}
                    step={50000}
                    thousandSeparator="."
                    decimalSeparator=","
                    {...form.getInputProps("rentalValue")}
                  />
                </Group>
                {form.values.rentalValue ? (
                  <Text size="xs" c="dimmed">
                    Cọc mỗi món: {formatVnd(Math.round((form.values.rentalValue || 0) / 2))} ·
                    Tiền thuê tính vào doanh thu, cọc hoàn khi trả.
                  </Text>
                ) : null}
              </>
            )}
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
