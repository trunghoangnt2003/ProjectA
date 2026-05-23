import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { usePagedResource } from "../../hooks/usePagedResource";
import { comboService } from "../../services/comboService";
import { productService } from "../../services/productService";
import { supplyService } from "../../services/supplyService";
import type { Combo, ComboLine, Product, StockItemSource, Supply } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

interface CatalogItem {
  key: string;
  source: StockItemSource;
  id: string;
  name: string;
  price: number;
}

export function ComboSection() {
  const { data, loading, create, update, remove, opts, totalPages, totalCount, setPage } = usePagedResource(comboService, {}, {
    created: "Đã tạo combo.",
    updated: "Đã cập nhật combo.",
    removed: "Đã xóa combo.",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [active, setActive] = useState(true);
  const [lines, setLines] = useState<ComboLine[]>([]);

  useEffect(() => {
    Promise.all([productService.list(), supplyService.list()]).then(([p, s]) => {
      setProducts(p);
      setSupplies(s);
    });
  }, []);

  // Catalog các mặt hàng bán được (hàng hóa + vật tư có giá bán) để chọn thành phần.
  const catalog = useMemo<CatalogItem[]>(() => {
    const fromP = products.map((p) => ({
      key: `product:${p.id}`, source: "product" as const, id: p.id, name: p.name, price: p.price,
    }));
    const fromS = supplies
      .filter((s) => s.forSale && s.salePrice != null)
      .map((s) => ({
        key: `supply:${s.id}`, source: "supply" as const, id: s.id, name: s.name, price: s.salePrice as number,
      }));
    return [...fromP, ...fromS];
  }, [products, supplies]);

  const priceOf = (line: ComboLine) =>
    catalog.find((c) => c.source === line.source && c.id === line.refId)?.price ?? 0;

  const originalTotal = (cb: { lines: ComboLine[] }) =>
    cb.lines.reduce((s, l) => s + priceOf(l) * l.quantity, 0);

  const formOriginal = lines.reduce((s, l) => s + priceOf(l) * l.quantity, 0);

  const openCreate = () => {
    setEditingId(null);
    setName(""); setDescription(""); setPrice(0); setActive(true); setLines([]);
    open();
  };

  const openEdit = (cb: Combo) => {
    setEditingId(cb.id);
    setName(cb.name); setDescription(cb.description ?? "");
    setPrice(cb.price); setActive(cb.active); setLines(cb.lines.map((l) => ({ ...l })));
    open();
  };

  const addLine = (key: string | null) => {
    const item = catalog.find((c) => c.key === key);
    if (!item) return;
    if (lines.some((l) => l.source === item.source && l.refId === item.id)) return;
    setLines((prev) => [...prev, { refId: item.id, source: item.source, name: item.name, quantity: 1 }]);
  };
  const setLineQty = (idx: number, qty: number) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, qty) } : l)));
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!name.trim()) return notify.error("Nhập tên combo.");
    if (lines.length === 0) return notify.error("Thêm ít nhất một thành phần.");
    if (price <= 0) return notify.error("Nhập giá combo.");
    const payload: Omit<Combo, "id"> = {
      name: name.trim(),
      description: description.trim() || undefined,
      lines,
      price,
      active,
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
  };

  const toggleActive = async (cb: Combo) => {
    const { id, ...rest } = cb;
    try {
      await update(id, { ...rest, active: !cb.active });
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const columns: DataTableColumn<Combo>[] = [
    {
      key: "name",
      header: "Combo",
      render: (cb) => (
        <div>
          <Text fw={600}>{cb.name}</Text>
          {cb.description && <Text size="xs" c="dimmed">{cb.description}</Text>}
        </div>
      ),
    },
    {
      key: "lines",
      header: "Thành phần",
      render: (cb) => (
        <Group gap={4}>
          {cb.lines.map((l) => (
            <Badge key={`${l.source}:${l.refId}`} size="sm" variant="light">
              {l.quantity}× {l.name}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: "price",
      header: "Giá",
      align: "right",
      render: (cb) => {
        const orig = originalTotal(cb);
        return (
          <div>
            <Text fw={600}>{formatVnd(cb.price)}</Text>
            {orig > cb.price && (
              <Text size="xs" c="dimmed" td="line-through">{formatVnd(orig)}</Text>
            )}
          </div>
        );
      },
    },
    {
      key: "active",
      header: "Bán ở POS",
      render: (cb) => (
        <Switch checked={cb.active} onChange={() => toggleActive(cb)} />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      render: (cb) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Sửa">
            <ActionIcon variant="subtle" onClick={() => openEdit(cb)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <ConfirmDeleteButton itemLabel={cb.name} onConfirm={() => remove(cb.id)} />
        </Group>
      ),
    },
  ];

  const saving100 = formOriginal > price && price > 0;

  return (
    <>
      <PageHeader
        title="Combo dịch vụ"
        subtitle="Gói nhiều mặt hàng bán kèm với giá ưu đãi — bán ở màn Bán hàng"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Tạo combo
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        rowKey={(cb) => cb.id}
        loading={loading}
        emptyTitle="Chưa có combo nào"
        page={opts.page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      <Modal opened={opened} onClose={close} title={editingId ? "Sửa combo" : "Tạo combo"} centered size="lg">
        <Stack>
          <TextInput label="Tên combo" required value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <Textarea label="Mô tả" autosize minRows={2} value={description} onChange={(e) => setDescription(e.currentTarget.value)} />

          <div>
            <Text size="sm" fw={500} mb={4}>Thành phần</Text>
            <Stack gap="xs">
              {lines.length === 0 && <Text size="sm" c="dimmed">Chưa có thành phần.</Text>}
              {lines.map((l, idx) => (
                <Group key={`${l.source}:${l.refId}`} gap="xs" wrap="nowrap">
                  <Text size="sm" style={{ flex: 1 }}>{l.name}</Text>
                  <Text size="xs" c="dimmed" w={90} ta="right">{formatVnd(priceOf(l))}/cái</Text>
                  <NumberInput
                    size="xs" w={80} min={1}
                    value={l.quantity}
                    onChange={(v) => setLineQty(idx, Number(v) || 1)}
                  />
                  <ActionIcon variant="subtle" color="red" onClick={() => removeLine(idx)} aria-label="Xóa">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
            <Select
              mt="xs"
              placeholder="+ Thêm thành phần…"
              searchable
              data={catalog
                .filter((c) => !lines.some((l) => l.source === c.source && l.refId === c.id))
                .map((c) => ({ value: c.key, label: `${c.name} · ${formatVnd(c.price)}` }))}
              value={null}
              onChange={addLine}
            />
          </div>

          <Group align="flex-end" gap="xs">
            <NumberInput
              label="Giá combo (₫)"
              required
              min={0}
              step={5000}
              thousandSeparator="."
              decimalSeparator=","
              style={{ flex: 1 }}
              value={price}
              onChange={(v) => setPrice(Number(v) || 0)}
            />
            <Button variant="light" onClick={() => setPrice(Math.round(formOriginal * 0.9))} disabled={formOriginal === 0}>
              Gợi ý −10%
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            Giá lẻ cộng lại: {formatVnd(formOriginal)}
            {saving100 && ` · tiết kiệm ${formatVnd(formOriginal - price)} (${Math.round((1 - price / formOriginal) * 100)}%)`}
          </Text>

          <Switch label="Bán ở màn Bán hàng (POS)" checked={active} onChange={(e) => setActive(e.currentTarget.checked)} />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
            <Button onClick={submit} loading={saving}>{editingId ? "Lưu" : "Tạo"}</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
