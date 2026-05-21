import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconArrowDown, IconArrowUp, IconSearch, IconBox, IconAlertTriangle } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { productService, PRODUCT_LOW_STOCK } from "../../services/productService";
import { supplyService } from "../../services/supplyService";
import { stockMovementService } from "../../services/stockMovementService";
import type {
  Product,
  StockItemSource,
  StockMovement,
  StockMovementType,
  Supply,
} from "../../types/domain";
import { formatDateTime } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const TYPE_META: Record<StockMovementType, { label: string; color: string; sign: string }> = {
  in: { label: "Nhập", color: "teal", sign: "+" },
  out: { label: "Xuất", color: "orange", sign: "−" },
  adjust: { label: "Điều chỉnh", color: "gray", sign: "" },
};

interface StockItem {
  key: string; // `${source}:${id}`
  source: StockItemSource;
  id: string;
  name: string;
  stock: number;
  unit: string;
  low: boolean;
}

export function InventorySection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [opened, { open, close }] = useDisclosure(false);
  const [txType, setTxType] = useState<StockMovementType>("in");
  const [itemKey, setItemKey] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<StockMovementType | "all">("all");

  const load = () => {
    setLoading(true);
    Promise.all([productService.list(), supplyService.list(), stockMovementService.list()])
      .then(([p, s, m]) => {
        setProducts(p);
        setSupplies(s);
        setMovements(m);
      })
      .catch((e) => notify.error(toMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const items = useMemo<StockItem[]>(() => {
    const fromP: StockItem[] = products.map((p) => ({
      key: `product:${p.id}`, source: "product", id: p.id, name: p.name,
      stock: p.stock, unit: "", low: p.stock <= PRODUCT_LOW_STOCK,
    }));
    const fromS: StockItem[] = supplies.map((s) => ({
      key: `supply:${s.id}`, source: "supply", id: s.id, name: s.name,
      stock: s.quantity, unit: s.unit, low: s.quantity <= s.reorderLevel,
    }));
    return [...fromP, ...fromS];
  }, [products, supplies]);

  const lowCount = items.filter((i) => i.low).length;

  const movementsView = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements
      .filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (q && !m.itemName.toLowerCase().includes(q) && !(m.reason ?? "").toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [movements, search, typeFilter]);

  const openTx = (type: StockMovementType) => {
    setTxType(type);
    setItemKey(null);
    setQty(0);
    setReason("");
    open();
  };

  const submitTx = async () => {
    const item = items.find((i) => i.key === itemKey);
    if (!item) {
      notify.error("Chọn mặt hàng.");
      return;
    }
    if (qty <= 0) {
      notify.error("Số lượng phải lớn hơn 0.");
      return;
    }
    if (txType === "out" && qty > item.stock) {
      notify.error(`Xuất quá tồn (còn ${item.stock}).`);
      return;
    }
    const balanceAfter = txType === "in" ? item.stock + qty : item.stock - qty;
    setSaving(true);
    try {
      if (item.source === "product") {
        const p = products.find((x) => x.id === item.id)!;
        const { id, ...rest } = p;
        await productService.update(id, { ...rest, stock: balanceAfter });
      } else {
        const s = supplies.find((x) => x.id === item.id)!;
        const { id, ...rest } = s;
        await supplyService.update(id, { ...rest, quantity: balanceAfter });
      }
      await stockMovementService.create({
        createdAt: new Date().toISOString(),
        itemSource: item.source,
        itemId: item.id,
        itemName: item.name,
        type: txType,
        quantity: qty,
        balanceAfter,
        reason: reason.trim() || undefined,
      });
      notify.success(txType === "in" ? "Đã nhập kho." : "Đã xuất kho.");
      close();
      load();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "time",
      header: "Thời gian",
      render: (m) => <Text size="xs" c="dimmed">{formatDateTime(m.createdAt)}</Text>,
    },
    {
      key: "item",
      header: "Mặt hàng",
      render: (m) => (
        <Group gap={6} wrap="nowrap">
          <Badge size="xs" variant="light" color={m.itemSource === "product" ? "grape" : "blue"}>
            {m.itemSource === "product" ? "Hàng hóa" : "Vật tư"}
          </Badge>
          <Text size="sm">{m.itemName}</Text>
        </Group>
      ),
    },
    {
      key: "type",
      header: "Loại",
      render: (m) => (
        <Badge variant="light" color={TYPE_META[m.type].color}>
          {TYPE_META[m.type].label}
        </Badge>
      ),
    },
    {
      key: "qty",
      header: "Số lượng",
      align: "right",
      render: (m) => (
        <Text fw={600} c={TYPE_META[m.type].color}>
          {TYPE_META[m.type].sign}{m.quantity}
        </Text>
      ),
    },
    { key: "balance", header: "Tồn sau", align: "right", render: (m) => m.balanceAfter },
    { key: "reason", header: "Lý do", render: (m) => m.reason ?? <Text c="dimmed">—</Text> },
  ];

  const selectedItem = items.find((i) => i.key === itemKey);

  return (
    <>
      <PageHeader
        title="Nhập / Xuất kho"
        subtitle="Giao dịch kho có lưu vết — cập nhật tồn cho Hàng hóa & Vật tư"
        actions={
          <>
            <Button color="teal" leftSection={<IconArrowDown size={16} />} onClick={() => openTx("in")}>
              Nhập kho
            </Button>
            <Button color="orange" variant="light" leftSection={<IconArrowUp size={16} />} onClick={() => openTx("out")}>
              Xuất kho
            </Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard label="Mặt hàng" value={items.length} icon={<IconBox size={26} />} color="brand" />
        <StatCard label="Sắp hết / cần nhập" value={lowCount} icon={<IconAlertTriangle size={26} />} color="orange" />
        <StatCard label="Giao dịch đã ghi" value={movements.length} icon={<IconBox size={26} />} color="teal" />
      </SimpleGrid>

      <Card mb="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Tìm kiếm"
            placeholder="Tên mặt hàng hoặc lý do…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            label="Loại"
            w={150}
            value={typeFilter}
            onChange={(v) => setTypeFilter((v as StockMovementType | "all") ?? "all")}
            data={[
              { value: "all", label: "Tất cả" },
              { value: "in", label: "Nhập" },
              { value: "out", label: "Xuất" },
            ]}
          />
        </Group>
      </Card>

      <DataTable
        data={movementsView}
        columns={columns}
        rowKey={(m) => m.id}
        loading={loading}
        emptyTitle="Chưa có giao dịch kho"
      />

      <Modal opened={opened} onClose={close} title={txType === "in" ? "Nhập kho" : "Xuất kho"} centered>
        <Stack>
          <SegmentedControl
            fullWidth
            value={txType}
            onChange={(v) => setTxType(v as StockMovementType)}
            data={[
              { value: "in", label: "Nhập kho" },
              { value: "out", label: "Xuất kho" },
            ]}
          />
          <Select
            label="Mặt hàng"
            required
            searchable
            placeholder="Chọn mặt hàng"
            data={items.map((i) => ({
              value: i.key,
              label: `${i.source === "product" ? "[Hàng hóa]" : "[Vật tư]"} ${i.name} · tồn ${i.stock}${i.unit ? " " + i.unit : ""}`,
            }))}
            value={itemKey}
            onChange={setItemKey}
          />
          <NumberInput
            label={`Số lượng ${txType === "in" ? "nhập" : "xuất"}`}
            min={1}
            value={qty}
            onChange={(v) => setQty(Number(v) || 0)}
          />
          {selectedItem && (
            <Text size="xs" c="dimmed">
              Tồn hiện tại: {selectedItem.stock}
              {selectedItem.unit ? " " + selectedItem.unit : ""} → sau giao dịch:{" "}
              {txType === "in" ? selectedItem.stock + qty : Math.max(selectedItem.stock - qty, 0)}
            </Text>
          )}
          <TextInput
            label="Lý do / ghi chú"
            placeholder={txType === "in" ? "VD: nhập nhà cung cấp" : "VD: hỏng, dùng nội bộ"}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
            <Button onClick={submitTx} loading={saving} color={txType === "in" ? "teal" : "orange"}>
              {txType === "in" ? "Nhập kho" : "Xuất kho"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
