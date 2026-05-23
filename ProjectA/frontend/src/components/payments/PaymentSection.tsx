import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Menu,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSearch,
  IconX,
  IconDots,
  IconCircleCheck,
  IconReceipt,
  IconArrowBackUp,
  IconAlertTriangle,
  IconCash,
  IconPrinter,
  IconPlus,
} from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { useCrudResource } from "../../hooks/useCrudResource";
import { paymentService } from "../../services/paymentService";
import { bookingService } from "../../services/bookingService";
import type { Booking, Payment, PaymentMethod, PaymentStatus } from "../../types/domain";
import { formatVnd, formatDateTime } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);

const METHOD_META: Record<PaymentMethod, { label: string; color: string }> = {
  cash: { label: "Tiền mặt", color: "teal" },
  qr: { label: "QR Banking", color: "blue" },
  ewallet: { label: "Ví điện tử", color: "grape" },
  card: { label: "Thẻ", color: "indigo" },
};

const STATUS_META: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "yellow" },
  paid: { label: "Đã thanh toán", color: "teal" },
  failed: { label: "Thất bại", color: "red" },
  refunded: { label: "Đã hoàn tiền", color: "gray" },
};

type StatusFilter = PaymentStatus | "all";
type MethodFilter = PaymentMethod | "all";

interface CollectForm {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: Extract<PaymentStatus, "paid" | "pending">;
}

import { usePagedResource } from "../../hooks/usePagedResource";

export function PaymentSection() {
  const { data: filtered, loading, create, update, page, totalPages, totalCount, setPage, setSearch, setDateRange } = usePagedResource(paymentService, {
    startDate: todayIso,
    endDate: todayIso,
    sortBy: "date",
    sortDesc: true,
  }, {
    created: "Đã tạo khoản thu.",
    updated: "Đã cập nhật thanh toán.",
  });
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [date, setDate] = useState(todayIso);

  const [invoice, setInvoice] = useState<Payment | null>(null);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [collectOpen, { open: openCollect, close: closeCollect }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // bookingService.getAll() instead of bookingService.list() but for now keep it simple or just fetch unpaid bookings. Wait, bookingService.getAll returns PagedResult. We might need to handle this.
    bookingService.getAll({ pageSize: 1000 }).then(res => setBookings(res.items)).catch((e) => notify.error(toMessage(e)));
  }, []);

  useEffect(() => {
    setDateRange(date || undefined, date || undefined);
  }, [date]);

  // Thống kê (toàn bộ dữ liệu, không theo bộ lọc).
  const stats = useMemo(() => {
    const paidToday = filtered
      .filter((p) => p.status === "paid" && (p.paidAt ?? p.createdAt).slice(0, 10) === todayIso)
      .reduce((s, p) => s + p.amount, 0);
    const pending = filtered.filter((p) => p.status === "pending");
    const refunded = filtered.filter((p) => p.status === "refunded");
    return {
      paidToday,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
      refundedAmount: refunded.reduce((s, p) => s + p.amount, 0),
    };
  }, [filtered]);

  const setStatus = async (p: Payment, status: PaymentStatus, note?: string) => {
    const { id, ...rest } = p;
    try {
      await update(id, {
        ...rest,
        status,
        paidAt: status === "paid" ? rest.paidAt ?? new Date().toISOString() : rest.paidAt,
        note: note ?? rest.note,
      });
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const confirmRefund = async () => {
    if (!refundTarget) return;
    await setStatus(refundTarget, "refunded", refundNote.trim() || undefined);
    setRefundTarget(null);
    setRefundNote("");
  };

  const hasFilter =
    searchQuery.trim() !== "" || statusFilter !== "all" || methodFilter !== "all" || date !== "";
  const clearFilters = () => {
    setSearchQuery("");
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setDate("");
    setDateRange(undefined, undefined);
  };

  // ---- Thu tiền cho lượt đặt ----
  const collectForm = useForm<CollectForm>({
    initialValues: { bookingId: "", amount: 0, method: "cash", status: "paid" },
    validate: {
      bookingId: (v) => (v ? null : "Chọn lượt đặt"),
      amount: (v) => (v > 0 ? null : "Số tiền phải lớn hơn 0"),
    },
  });

  const openCollectModal = () => {
    collectForm.setValues({ bookingId: "", amount: 0, method: "cash", status: "paid" });
    openCollect();
  };

  const onPickBooking = (bookingId: string | null) => {
    collectForm.setFieldValue("bookingId", bookingId ?? "");
    const b = bookings.find((x) => x.id === bookingId);
    if (b) collectForm.setFieldValue("amount", b.totalPrice);
  };

  const submitCollect = collectForm.onSubmit(async (values) => {
    const b = bookings.find((x) => x.id === values.bookingId);
    if (!b) return;
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await create({
        code: "PT-" + Math.floor(3000 + Math.random() * 6000),
        source: "booking",
        refId: b.id,
        refCode: b.code,
        customerName: b.customerName,
        amount: values.amount,
        method: values.method,
        status: values.status,
        createdAt: now,
        paidAt: values.status === "paid" ? now : undefined,
      });
      closeCollect();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  const columns: DataTableColumn<Payment>[] = [
    { key: "code", header: "Mã", render: (p) => <Text fw={600}>{p.code}</Text> },
    {
      key: "ref",
      header: "Tham chiếu",
      render: (p) => (
        <Group gap={6} wrap="nowrap">
          <Badge size="xs" variant="light" color={p.source === "booking" ? "blue" : "grape"}>
            {p.source === "booking" ? "Đặt sân" : "Bán hàng"}
          </Badge>
          <Text size="sm">{p.refCode}</Text>
        </Group>
      ),
    },
    { key: "customer", header: "Khách hàng", render: (p) => p.customerName ?? "Khách lẻ" },
    {
      key: "amount",
      header: "Số tiền",
      align: "right",
      render: (p) => <Text fw={600}>{formatVnd(p.amount)}</Text>,
    },
    {
      key: "method",
      header: "Phương thức",
      render: (p) => (
        <Badge variant="light" color={METHOD_META[p.method].color}>
          {METHOD_META[p.method].label}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (p) => {
        const badge = (
          <Badge variant="light" color={STATUS_META[p.status].color}>
            {STATUS_META[p.status].label}
          </Badge>
        );
        return p.status === "refunded" && p.note ? (
          <Tooltip label={`Lý do: ${p.note}`}>{badge}</Tooltip>
        ) : (
          badge
        );
      },
    },
    {
      key: "time",
      header: "Thời gian",
      render: (p) => (
        <Text size="xs" c="dimmed">
          {formatDateTime(p.paidAt ?? p.createdAt)}
        </Text>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 90,
      render: (p) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Xem hóa đơn">
            <ActionIcon variant="subtle" onClick={() => setInvoice(p)}>
              <IconReceipt size={18} />
            </ActionIcon>
          </Tooltip>
          <PaymentActions
            payment={p}
            onConfirm={() => setStatus(p, "paid")}
            onFail={() => setStatus(p, "failed")}
            onRefund={() => {
              setRefundTarget(p);
              setRefundNote("");
            }}
          />
        </Group>
      ),
    },
  ];

  const unpaidBookings = bookings;

  return (
    <>
      <PageHeader
        title="Thanh toán"
        subtitle="Theo dõi khoản thu, xác nhận chuyển khoản, hoàn tiền & hóa đơn"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCollectModal}>
            Thu tiền
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard label="Thực thu hôm nay" value={formatVnd(stats.paidToday)} icon={<IconCash size={26} />} color="teal" />
        <StatCard
          label="Chờ thanh toán"
          value={`${stats.pendingCount} · ${formatVnd(stats.pendingAmount)}`}
          icon={<IconAlertTriangle size={26} />}
          color="orange"
        />
        <StatCard label="Đã hoàn tiền" value={formatVnd(stats.refundedAmount)} icon={<IconArrowBackUp size={26} />} color="gray" />
      </SimpleGrid>

      <Card mb="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Tìm kiếm"
            placeholder="Mã PT, mã tham chiếu, khách…"
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchQuery);
            }}
            onBlur={() => setSearch(searchQuery)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            label="Trạng thái"
            w={160}
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as StatusFilter) ?? "all")}
            data={[
              { value: "all", label: "Tất cả" },
              ...Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })),
            ]}
          />
          <Select
            label="Phương thức"
            w={150}
            value={methodFilter}
            onChange={(v) => setMethodFilter((v as MethodFilter) ?? "all")}
            data={[
              { value: "all", label: "Tất cả" },
              ...Object.entries(METHOD_META).map(([value, m]) => ({ value, label: m.label })),
            ]}
          />
          <TextInput label="Ngày" type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
          {hasFilter && (
            <Button variant="subtle" color="gray" leftSection={<IconX size={16} />} onClick={clearFilters}>
              Xóa lọc
            </Button>
          )}
        </Group>
      </Card>

      <DataTable
        data={filtered.filter((p) => {
          if (statusFilter !== "all" && p.status !== statusFilter) return false;
          if (methodFilter !== "all" && p.method !== methodFilter) return false;
          return true;
        })}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        emptyTitle={hasFilter ? "Không có khoản thu khớp bộ lọc" : "Chưa có khoản thu nào"}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      {/* Hóa đơn */}
      <Modal opened={invoice !== null} onClose={() => setInvoice(null)} title="Hóa đơn thanh toán" centered>
        {invoice && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={700} size="lg">{invoice.code}</Text>
              <Badge variant="light" color={STATUS_META[invoice.status].color}>
                {STATUS_META[invoice.status].label}
              </Badge>
            </Group>
            <Divider />
            <InvoiceRow label="Tham chiếu" value={`${invoice.source === "booking" ? "Đặt sân" : "Bán hàng"} · ${invoice.refCode}`} />
            <InvoiceRow label="Khách hàng" value={invoice.customerName ?? "Khách lẻ"} />
            <InvoiceRow label="Phương thức" value={METHOD_META[invoice.method].label} />
            <InvoiceRow label="Thời gian" value={formatDateTime(invoice.paidAt ?? invoice.createdAt)} />
            {invoice.note && <InvoiceRow label="Ghi chú" value={invoice.note} />}
            <Divider />
            <Group justify="space-between">
              <Text fw={600}>Tổng tiền</Text>
              <Text fw={700} size="lg" c="brand">{formatVnd(invoice.amount)}</Text>
            </Group>
            <Group justify="flex-end" mt="sm">
              <Button variant="default" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
                In hóa đơn
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Hoàn tiền */}
      <Modal opened={refundTarget !== null} onClose={() => setRefundTarget(null)} title="Hoàn tiền" centered>
        {refundTarget && (
          <Stack>
            <Text size="sm">
              Hoàn <b>{formatVnd(refundTarget.amount)}</b> cho {refundTarget.refCode} —{" "}
              {refundTarget.customerName ?? "Khách lẻ"}?
            </Text>
            <Textarea
              label="Lý do hoàn tiền"
              placeholder="VD: khách hủy, thu nhầm…"
              autosize
              minRows={2}
              value={refundNote}
              onChange={(e) => setRefundNote(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRefundTarget(null)}>Đóng</Button>
              <Button color="gray" onClick={confirmRefund}>Xác nhận hoàn</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Thu tiền cho lượt đặt */}
      <Modal opened={collectOpen} onClose={closeCollect} title="Thu tiền lượt đặt" centered>
        <form onSubmit={submitCollect}>
          <Stack>
            <Select
              label="Lượt đặt"
              required
              searchable
              placeholder="Chọn lượt đặt cần thu"
              data={unpaidBookings.map((b) => ({
                value: b.id,
                label: `${b.code} · ${b.customerName} · ${formatVnd(b.totalPrice)}`,
              }))}
              value={collectForm.values.bookingId || null}
              onChange={onPickBooking}
              error={collectForm.errors.bookingId}
            />
            <NumberInput
              label="Số tiền (₫)"
              min={0}
              step={10000}
              thousandSeparator="."
              decimalSeparator=","
              {...collectForm.getInputProps("amount")}
            />
            <Select
              label="Phương thức"
              data={Object.entries(METHOD_META).map(([value, m]) => ({ value, label: m.label }))}
              {...collectForm.getInputProps("method")}
            />
            <Select
              label="Trạng thái"
              data={[
                { value: "paid", label: "Đã thanh toán" },
                { value: "pending", label: "Chờ thanh toán (đợi xác nhận CK)" },
              ]}
              {...collectForm.getInputProps("status")}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeCollect} disabled={saving}>Hủy</Button>
              <Button type="submit" loading={saving}>Tạo khoản thu</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

/** Menu hành động theo trạng thái khoản thu. */
function PaymentActions({
  payment,
  onConfirm,
  onFail,
  onRefund,
}: {
  payment: Payment;
  onConfirm: () => void;
  onFail: () => void;
  onRefund: () => void;
}) {
  const canConfirm = payment.status === "pending" || payment.status === "failed";
  const canFail = payment.status === "pending";
  const canRefund = payment.status === "paid";
  const hasAction = canConfirm || canFail || canRefund;

  return (
    <Menu position="bottom-end" withinPortal disabled={!hasAction}>
      <Menu.Target>
        <Tooltip label={hasAction ? "Hành động" : "Không có hành động"}>
          <ActionIcon variant="subtle" disabled={!hasAction}>
            <IconDots size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {canConfirm && (
          <Menu.Item color="teal" leftSection={<IconCircleCheck size={16} />} onClick={onConfirm}>
            Xác nhận đã thu
          </Menu.Item>
        )}
        {canFail && (
          <Menu.Item color="red" leftSection={<IconAlertTriangle size={16} />} onClick={onFail}>
            Đánh dấu thất bại
          </Menu.Item>
        )}
        {canRefund && (
          <Menu.Item color="gray" leftSection={<IconArrowBackUp size={16} />} onClick={onRefund}>
            Hoàn tiền…
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

function InvoiceRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={500} ta="right">{value}</Text>
    </Group>
  );
}
