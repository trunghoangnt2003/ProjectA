import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
} from "@tabler/icons-react";
import { PageHeader, EmptyState } from "../common";
import { productService } from "../../services/productService";
import { supplyService } from "../../services/supplyService";
import { courtService } from "../../services/courtService";
import { orderService } from "../../services/orderService";
import { comboService } from "../../services/comboService";
import { rentalService } from "../../services/rentalService";
import type { Combo, Court, OrderLine, Product, Supply } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

/** Một mặt hàng bán được — gộp Hàng hóa, Vật tư bán, Combo và Thuê đồ về cùng một dạng. */
interface Sellable {
  key: string; // `${source}:${id}` — định danh trong giỏ
  id: string;
  source: "product" | "supply" | "combo" | "rental";
  name: string;
  category: string;
  price: number;
  stock: number; // tồn còn bán/cho thuê được
  unit?: string;
  rentalValue?: number; // chỉ source "rental" — tính cọc = 1/2 giá trị món
}

/** Vật tư cho thuê = vật tư sân nhóm Vợt/Giày đã cấu hình giá thuê. */
const isRentable = (s: Supply) =>
  !s.forSale && s.rentalPrice != null && (s.category === "Vợt" || s.category === "Giày");

/** Cọc giữ cho một dòng thuê = 1/2 giá trị món × số lượng. */
const depositOf = (item: Sellable, qty: number) =>
  item.source === "rental" ? Math.round((item.rentalValue ?? 0) / 2) * qty : 0;

/** Tồn còn bán của một combo = số bộ tối đa lắp được từ tồn thành phần. */
function comboStock(combo: Combo, products: Product[], supplies: Supply[]): number {
  let max = Infinity;
  for (const line of combo.lines) {
    const stock =
      line.source === "product"
        ? products.find((p) => p.id === line.refId)?.stock ?? 0
        : supplies.find((s) => s.id === line.refId)?.quantity ?? 0;
    max = Math.min(max, Math.floor(stock / line.quantity));
  }
  return Number.isFinite(max) ? max : 0;
}

function buildCatalog(products: Product[], supplies: Supply[], combos: Combo[]): Sellable[] {
  const fromProducts: Sellable[] = products.map((p) => ({
    key: `product:${p.id}`,
    id: p.id,
    source: "product",
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
  }));
  // Chỉ vật tư bán (forSale) mới lên màn bán hàng.
  const fromSupplies: Sellable[] = supplies
    .filter((s) => s.forSale && s.salePrice != null)
    .map((s) => ({
      key: `supply:${s.id}`,
      id: s.id,
      source: "supply",
      name: s.name,
      category: s.category,
      price: s.salePrice as number,
      stock: s.quantity,
      unit: s.unit,
    }));
  // Combo đang bật bán ở POS.
  const fromCombos: Sellable[] = combos
    .filter((c) => c.active)
    .map((c) => ({
      key: `combo:${c.id}`,
      id: c.id,
      source: "combo",
      name: c.name,
      category: "Combo",
      price: c.price,
      stock: comboStock(c, products, supplies),
    }));
  // Vật tư cho thuê (vợt/giày) — bán theo giá thuê, kèm thu cọc khi thanh toán.
  const fromRentals: Sellable[] = supplies.filter(isRentable).map((s) => ({
    key: `rental:${s.id}`,
    id: s.id,
    source: "rental",
    name: `Thuê ${s.name}`,
    category: "Thuê đồ",
    price: s.rentalPrice as number,
    stock: s.quantity,
    unit: s.unit,
    rentalValue: s.rentalValue,
  }));
  return [...fromCombos, ...fromRentals, ...fromProducts, ...fromSupplies];
}

export function SaleSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({}); // key -> số lượng
  const [customerName, setCustomerName] = useState("");
  const [courtName, setCourtName] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      productService.list(),
      supplyService.list(),
      courtService.list(),
      comboService.list(),
    ])
      .then(([p, s, c, cb]) => {
        setProducts(p);
        setSupplies(s);
        setCourts(c);
        setCombos(cb);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const catalog = useMemo(
    () => buildCatalog(products, supplies, combos),
    [products, supplies, combos]
  );
  const byKey = useMemo(() => {
    const m: Record<string, Sellable> = {};
    for (const item of catalog) m[item.key] = item;
    return m;
  }, [catalog]);

  const comboById = useMemo(() => {
    const m: Record<string, Combo> = {};
    for (const c of combos) m[c.id] = c;
    return m;
  }, [combos]);

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((c) => c.category))).sort(),
    [catalog]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalog, search, category]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([key, qty]) => ({ item: byKey[key], qty }))
        .filter((l) => l.item), // bỏ mục đã biến mất khỏi catalog
    [cart, byKey]
  );

  const total = cartLines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const depositTotal = cartLines.reduce((sum, l) => sum + depositOf(l.item, l.qty), 0);

  const addToCart = (item: Sellable) => {
    setCart((prev) => {
      const cur = prev[item.key] ?? 0;
      if (cur >= item.stock) {
        notify.error(`"${item.name}" chỉ còn ${item.stock} trong kho.`);
        return prev;
      }
      return { ...prev, [item.key]: cur + 1 };
    });
  };

  const setQty = (key: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      const max = byKey[key]?.stock ?? qty;
      return { ...prev, [key]: Math.min(qty, max) };
    });
  };

  const clearCart = () => {
    setCart({});
    setCustomerName("");
    setCourtName(null);
  };

  /** Bước 1: kiểm tra tồn rồi mở hộp xác nhận hóa đơn. */
  const reviewOrder = () => {
    if (cartLines.length === 0) return;
    for (const { item, qty } of cartLines) {
      if (qty > item.stock) {
        notify.error(`"${item.name}" không đủ tồn (còn ${item.stock}).`);
        return;
      }
    }
    openConfirm();
  };

  /** Bước 2: chốt thanh toán — trừ kho, tạo hóa đơn & phiếu thuê. */
  const confirmCheckout = async () => {
    setPaying(true);
    try {
      // Gom nhu cầu trừ kho theo từng mặt hàng (combo nở ra thành phần).
      const deductProduct = new Map<string, number>();
      const deductSupply = new Map<string, number>();
      const addP = (id: string, q: number) => deductProduct.set(id, (deductProduct.get(id) ?? 0) + q);
      const addS = (id: string, q: number) => deductSupply.set(id, (deductSupply.get(id) ?? 0) + q);

      for (const { item, qty } of cartLines) {
        if (item.source === "product") addP(item.id, qty);
        else if (item.source === "supply" || item.source === "rental") addS(item.id, qty);
        else {
          const combo = comboById[item.id];
          for (const line of combo?.lines ?? []) {
            if (line.source === "product") addP(line.refId, line.quantity * qty);
            else addS(line.refId, line.quantity * qty);
          }
        }
      }

      for (const [id, q] of deductProduct) {
        const p = products.find((x) => x.id === id);
        if (p) {
          const { id: pid, ...rest } = p;
          await productService.update(pid, { ...rest, stock: Math.max(p.stock - q, 0) });
        }
      }
      for (const [id, q] of deductSupply) {
        const s = supplies.find((x) => x.id === id);
        if (s) {
          const { id: sid, ...rest } = s;
          await supplyService.update(sid, { ...rest, quantity: Math.max(s.quantity - q, 0) });
        }
      }

      const now = new Date().toISOString();
      const lines: OrderLine[] = cartLines.map(({ item, qty }) => ({
        refId: item.id,
        source: item.source,
        name: item.name,
        unitPrice: item.price,
        quantity: qty,
      }));
      await orderService.create({
        code: "HD-" + Math.floor(1000 + Math.random() * 9000),
        createdAt: now,
        customerName: customerName.trim() || undefined,
        courtName: courtName ?? undefined,
        lines,
        total,
        deposit: depositTotal || undefined,
      });

      // Mỗi dòng thuê → tạo phiếu thuê để màn Thuê đồ theo dõi nhận trả & hoàn cọc.
      for (const { item, qty } of cartLines) {
        if (item.source !== "rental") continue;
        const supply = supplies.find((s) => s.id === item.id);
        await rentalService.create({
          code: "TH-" + Math.floor(5000 + Math.random() * 4000),
          itemId: item.id,
          itemName: supply?.name ?? item.name.replace(/^Thuê /, ""),
          customerName: customerName.trim() || "Khách lẻ",
          quantity: qty,
          fee: item.price * qty,
          deposit: depositOf(item, qty),
          borrowedAt: now,
          status: "borrowed",
          note: courtName ? `POS · ${courtName}` : "POS",
        });
      }

      notify.success(
        depositTotal > 0
          ? `Đã thanh toán ${formatVnd(total)} · giữ cọc ${formatVnd(depositTotal)}.`
          : `Đã thanh toán ${formatVnd(total)}.`
      );
      closeConfirm();
      clearCart();
      load(); // tải lại tồn kho mới
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Bán hàng"
        subtitle="Tính bill đồ uống, đồ ăn, cầu, thuê đồ… — trừ kho và tính vào doanh thu"
      />

      <Group align="flex-start" gap="lg" wrap="wrap">
        {/* Catalog */}
        <Box style={{ flex: "3 1 360px", minWidth: 0 }}>
          <Group mb="md" gap="sm" wrap="wrap">
            <TextInput
              placeholder="Tìm hàng hóa…"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
            <Select
              w={170}
              value={category}
              onChange={(v) => setCategory(v ?? "all")}
              data={[
                { value: "all", label: "Tất cả loại" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </Group>

          {!loading && filtered.length === 0 ? (
            <Card p={0}>
              <EmptyState title="Không có hàng hóa khớp" />
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
              {filtered.map((item) => {
                const out = item.stock <= 0;
                const inCart = cart[item.key] ?? 0;
                return (
                  <UnstyledButton
                    key={item.key}
                    onClick={() => !out && addToCart(item)}
                    disabled={out}
                  >
                    <Card
                      withBorder
                      p="sm"
                      shadow="xs"
                      style={{
                        height: "100%",
                        opacity: out ? 0.55 : 1,
                        cursor: out ? "not-allowed" : "pointer",
                        borderColor: inCart
                          ? "var(--mantine-color-brand-5)"
                          : undefined,
                      }}
                    >
                      <Stack gap={4} h="100%" justify="space-between">
                        <Text size="sm" fw={600} lineClamp={2}>
                          {item.name}
                        </Text>
                        <div>
                          <Text size="xs" c="dimmed">
                            {item.category}
                          </Text>
                          <Group justify="space-between" mt={4} wrap="nowrap">
                            <Text size="sm" fw={700} c="brand">
                              {formatVnd(item.price)}
                            </Text>
                            {out ? (
                              <Badge size="xs" color="red" variant="light">
                                Hết
                              </Badge>
                            ) : (
                              <Text size="10px" c="dimmed">
                                Tồn {item.stock}
                              </Text>
                            )}
                          </Group>
                        </div>
                        {inCart > 0 && (
                          <Badge size="xs" color="brand" variant="filled">
                            Trong giỏ: {inCart}
                          </Badge>
                        )}
                      </Stack>
                    </Card>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          )}
        </Box>

        {/* Giỏ hàng / hóa đơn */}
        <Box style={{ flex: "1 1 300px", minWidth: 0 }}>
          <Card withBorder shadow="sm" style={{ position: "sticky", top: 16 }}>
            <Group gap="xs" mb="sm">
              <IconShoppingCart size={20} />
              <Text fw={700}>Hóa đơn</Text>
              {cartLines.length > 0 && (
                <Badge color="brand" variant="light" ml="auto">
                  {cartLines.length} mặt hàng
                </Badge>
              )}
            </Group>

            <Stack gap="xs" mb="sm">
              <TextInput
                size="sm"
                label="Khách hàng (tùy chọn)"
                placeholder="Khách lẻ"
                value={customerName}
                onChange={(e) => setCustomerName(e.currentTarget.value)}
              />
              <Select
                size="sm"
                label="Sân (tùy chọn)"
                placeholder="Không gắn sân"
                clearable
                data={courts.map((c) => c.name)}
                value={courtName}
                onChange={setCourtName}
              />
            </Stack>

            <Divider mb="xs" />

            {cartLines.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="lg">
                Chọn hàng hóa bên trái để thêm vào hóa đơn.
              </Text>
            ) : (
              <ScrollArea.Autosize mah={300} mb="sm">
                <Stack gap="xs">
                  {cartLines.map(({ item, qty }) => {
                    const combo = item.source === "combo" ? comboById[item.id] : undefined;
                    const dep = depositOf(item, qty);
                    return (
                      <Group key={item.key} gap="xs" wrap="nowrap" align="flex-start">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {item.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatVnd(item.price)} × {qty}
                          </Text>
                          {/* Combo: hiện món bên trong */}
                          {combo && (
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              Gồm: {combo.lines.map((l) => `${l.quantity * qty}× ${l.name}`).join(", ")}
                            </Text>
                          )}
                          {/* Thuê đồ: hiện cọc giữ */}
                          {dep > 0 && (
                            <Text size="xs" c="grape">
                              Cọc giữ: {formatVnd(dep)}
                            </Text>
                          )}
                        </div>
                        <Group gap={2} wrap="nowrap">
                          <ActionIcon
                            size="sm"
                            variant="default"
                            onClick={() => setQty(item.key, qty - 1)}
                            aria-label="Giảm"
                          >
                            <IconMinus size={14} />
                          </ActionIcon>
                          <Text size="sm" w={20} ta="center">
                            {qty}
                          </Text>
                          <ActionIcon
                            size="sm"
                            variant="default"
                            onClick={() => setQty(item.key, qty + 1)}
                            disabled={qty >= item.stock}
                            aria-label="Tăng"
                          >
                            <IconPlus size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => setQty(item.key, 0)}
                            aria-label="Xóa"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            )}

            <Divider mb="xs" />
            <Group justify="space-between" mb={depositTotal > 0 ? 4 : "md"}>
              <Text fw={600}>Tổng cộng</Text>
              <Text fw={700} size="lg" c="brand">
                {formatVnd(total)}
              </Text>
            </Group>
            {depositTotal > 0 && (
              <>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" c="dimmed">
                    Cọc giữ (hoàn khi trả)
                  </Text>
                  <Text size="sm" c="grape" fw={600}>
                    {formatVnd(depositTotal)}
                  </Text>
                </Group>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Khách trả</Text>
                  <Text fw={700}>{formatVnd(total + depositTotal)}</Text>
                </Group>
              </>
            )}

            <Group grow>
              <Button
                variant="default"
                onClick={clearCart}
                disabled={cartLines.length === 0 || paying}
              >
                Xóa giỏ
              </Button>
              <Button onClick={reviewOrder} disabled={cartLines.length === 0}>
                Thanh toán
              </Button>
            </Group>
          </Card>
        </Box>
      </Group>

      {/* Hộp xác nhận hóa đơn trước khi thanh toán */}
      <Modal
        opened={confirmOpen}
        onClose={closeConfirm}
        title="Xác nhận hóa đơn"
        centered
        size="lg"
      >
        <Stack gap="sm">
          {(customerName.trim() || courtName) && (
            <Text size="sm" c="dimmed">
              {customerName.trim() || "Khách lẻ"}
              {courtName ? ` · ${courtName}` : ""}
            </Text>
          )}

          <Stack gap="xs">
            {cartLines.map(({ item, qty }) => {
              const combo = item.source === "combo" ? comboById[item.id] : undefined;
              const dep = depositOf(item, qty);
              return (
                <Box key={item.key}>
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500}>
                        {item.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatVnd(item.price)} × {qty}
                      </Text>
                    </div>
                    <Text size="sm" fw={600}>
                      {formatVnd(item.price * qty)}
                    </Text>
                  </Group>
                  {/* Combo: liệt kê món bên trong */}
                  {combo && (
                    <Stack gap={0} pl="md" mt={2}>
                      {combo.lines.map((l) => (
                        <Text key={`${l.source}:${l.refId}`} size="xs" c="dimmed">
                          • {l.quantity * qty}× {l.name}
                        </Text>
                      ))}
                    </Stack>
                  )}
                  {/* Thuê đồ: cọc giữ */}
                  {dep > 0 && (
                    <Text size="xs" c="grape" pl="md" mt={2}>
                      Cọc giữ: {formatVnd(dep)} (hoàn khi trả)
                    </Text>
                  )}
                </Box>
              );
            })}
          </Stack>

          <Divider />

          <Group justify="space-between">
            <Text fw={600}>Tổng tiền (doanh thu)</Text>
            <Text fw={700} c="brand">
              {formatVnd(total)}
            </Text>
          </Group>
          {depositTotal > 0 && (
            <>
              <Group justify="space-between">
                <Text c="dimmed">Cọc giữ (hoàn khi trả)</Text>
                <Text c="grape" fw={600}>
                  {formatVnd(depositTotal)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text fw={700}>Khách trả</Text>
                <Text fw={700} size="lg">
                  {formatVnd(total + depositTotal)}
                </Text>
              </Group>
            </>
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeConfirm} disabled={paying}>
              Quay lại
            </Button>
            <Button onClick={confirmCheckout} loading={paying}>
              Xác nhận thanh toán
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
