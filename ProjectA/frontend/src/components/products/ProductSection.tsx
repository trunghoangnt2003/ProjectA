import { useState } from "react";
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
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
import { productService, PRODUCT_LOW_STOCK } from "../../services/productService";
import type { Product } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const CATEGORIES = ["Nước suối", "Nước ngọt", "Tăng lực", "Bia", "Đồ ăn", "Khác"];

function stockBadge(stock: number) {
  if (stock <= 0) return { label: "Hết hàng", color: "red" };
  if (stock <= PRODUCT_LOW_STOCK) return { label: "Sắp hết", color: "orange" };
  return { label: "Còn hàng", color: "teal" };
}

type ProductForm = Omit<Product, "id">;

const emptyForm: ProductForm = {
  name: "",
  category: "Nước ngọt",
  price: 10000,
  stock: 0,
};

export function ProductSection() {
  const { data, loading, create, update, remove } = useCrudResource(
    productService,
    { created: "Đã thêm hàng hóa.", updated: "Đã cập nhật.", removed: "Đã xóa." }
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProductForm>({
    initialValues: emptyForm,
    validate: {
      name: (v) => (v.trim() ? null : "Nhập tên hàng hóa"),
      price: (v) => (v > 0 ? null : "Giá phải lớn hơn 0"),
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm);
    open();
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    form.setValues({ ...p });
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

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "Tên", render: (p) => <Text fw={500}>{p.name}</Text> },
    { key: "category", header: "Loại", render: (p) => p.category },
    { key: "price", header: "Giá bán", align: "right", render: (p) => formatVnd(p.price) },
    { key: "stock", header: "Tồn kho", align: "right", render: (p) => p.stock },
    {
      key: "status",
      header: "Tình trạng",
      render: (p) => {
        const s = stockBadge(p.stock);
        return (
          <Badge variant="light" color={s.color}>
            {s.label}
          </Badge>
        );
      },
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
          <ConfirmDeleteButton itemLabel={p.name} onConfirm={() => remove(p.id)} />
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Hàng hóa"
        subtitle="Đồ uống, đồ ăn và hàng bán cho khách"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Thêm hàng hóa
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        emptyTitle="Chưa có hàng hóa nào"
      />

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? "Sửa hàng hóa" : "Thêm hàng hóa"}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Tên" required {...form.getInputProps("name")} />
            <Select label="Loại" data={CATEGORIES} {...form.getInputProps("category")} />
            <NumberInput
              label="Giá bán (₫)"
              min={0}
              step={1000}
              thousandSeparator="."
              decimalSeparator=","
              {...form.getInputProps("price")}
            />
            <NumberInput label="Tồn kho" min={0} {...form.getInputProps("stock")} />
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
