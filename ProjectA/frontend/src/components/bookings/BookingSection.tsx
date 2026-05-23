import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Modal,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconPencil,
  IconSearch,
  IconX,
  IconPhone,
  IconDots,
  IconCircleCheck,
  IconLogin2,
  IconLogout2,
  IconUserX,
  IconBan,
} from "@tabler/icons-react";
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { BookingCalendar, CalendarLegend } from "./BookingCalendar";
import { useCrudResource } from "../../hooks/useCrudResource";
import { bookingService } from "../../services/bookingService";
import { courtService } from "../../services/courtService";
import { STATUS_META, type StatusMeta } from "./bookingStatus";
import type { Booking, BookingStatus, Court } from "../../types/domain";
import { formatVnd, formatDate } from "../../lib/format";
import { estimateBookingPrice } from "../../lib/pricing";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);

type ViewMode = "list" | "calendar";
type StatusFilter = BookingStatus | "all";

/** Hành động chuyển trạng thái khả dụng theo status hiện tại. */
const NEXT_ACTIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "playing", "no-show", "cancelled"],
  confirmed: ["playing", "no-show", "cancelled"],
  playing: ["completed"],
  completed: [],
  cancelled: [],
  "no-show": [],
};

const ACTION_META: Record<
  BookingStatus,
  { label: string; icon: React.ReactNode; color?: string }
> = {
  confirmed: { label: "Xác nhận", icon: <IconCircleCheck size={16} />, color: "blue" },
  playing: { label: "Check-in (vào sân)", icon: <IconLogin2 size={16} />, color: "green" },
  completed: { label: "Check-out (kết thúc)", icon: <IconLogout2 size={16} />, color: "teal" },
  "no-show": { label: "Đánh dấu không đến", icon: <IconUserX size={16} />, color: "gray" },
  cancelled: { label: "Hủy lượt…", icon: <IconBan size={16} />, color: "red" },
  pending: { label: "Chờ xác nhận", icon: <IconCircleCheck size={16} /> },
};

type BookingForm = Omit<Booking, "id" | "courtName">;

function emptyForm(): BookingForm {
  return {
    code: "BK-" + Math.floor(1000 + Math.random() * 9000),
    customerName: "",
    customerPhone: "",
    date: todayIso,
    startTime: "18:00",
    endTime: "20:00",
    status: "pending",
    totalPrice: 0,
  };
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const newCode = () => "BK-" + Math.floor(1000 + Math.random() * 9000);

import { usePagedResource } from "../../hooks/usePagedResource";

export function BookingSection() {
  const { data, loading, reload, update, remove, opts, page, totalPages, totalCount, setPage, setSearch, setDateRange, setPageSize } = usePagedResource(
    bookingService,
    { startDate: todayIso, endDate: todayIso, sortBy: "date", sortDesc: true },
    { created: "Đã tạo lượt đặt.", updated: "Đã cập nhật.", removed: "Đã xóa lượt đặt." }
  );
  const [courts, setCourts] = useState<Court[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Chọn sân tách khỏi form: tạo cho phép nhiều sân, sửa chỉ 1 sân (để đổi sân).
  const [createCourts, setCreateCourts] = useState<string[]>([]);
  const [editCourt, setEditCourt] = useState<string>("");
  const [repeatWeeks, setRepeatWeeks] = useState(1);

  // Hủy có lý do.
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [view, setView] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [listDate, setListDate] = useState(todayIso);
  const [calDate, setCalDate] = useState(todayIso);

  useEffect(() => {
    courtService.list().then(setCourts);
  }, []);

  const form = useForm<BookingForm>({
    initialValues: emptyForm(),
    validate: {
      customerName: (v) => (v.trim() ? null : "Nhập tên khách"),
      customerPhone: (v) =>
        /^0\d{9,10}$/.test(v.trim()) ? null : "SĐT không hợp lệ (10–11 số)",
    },
  });

  const filtered = useMemo(() => {
    return data.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      return true;
    });
  }, [data, statusFilter]);

  const calBookings = useMemo(
    () => data.filter((b) => b.date === calDate),
    [data, calDate]
  );

  const hasFilter = searchQuery.trim() !== "" || statusFilter !== "all" || listDate !== "";
  const clearFilters = () => {
    setSearchQuery("");
    setSearch("");
    setStatusFilter("all");
    setListDate("");
    setDateRange(undefined, undefined);
  };

  useEffect(() => {
    if (view === "calendar") {
      setDateRange(calDate, calDate);
      setPageSize(500);
    } else {
      setDateRange(listDate || undefined, listDate || undefined);
      setPageSize(20);
    }
  }, [view, calDate, listDate]);

  const courtOptions = courts.map((c) => c.name);

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm());
    setCreateCourts([]);
    setRepeatWeeks(1);
    open();
  };

  const openEdit = (b: Booking) => {
    setEditingId(b.id);
    form.setValues({
      code: b.code,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      totalPrice: b.totalPrice,
    });
    setEditCourt(b.courtName);
    open();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setSaving(true);
    try {
      if (editingId) {
        if (!editCourt) {
          notify.error("Chọn sân.");
          return;
        }
        await update(editingId, { ...values, courtName: editCourt });
      } else {
        if (createCourts.length === 0) {
          notify.error("Chọn ít nhất một sân.");
          return;
        }
        // Tạo lượt cho mỗi (sân × tuần lặp). repeatWeeks=1 => chỉ ngày đã chọn.
        const weeks = Math.max(1, repeatWeeks);
        let count = 0;
        for (let w = 0; w < weeks; w++) {
          const date = addDaysIso(values.date, w * 7);
          for (const courtName of createCourts) {
            await bookingService.create({
              ...values,
              code: newCode(),
              courtName,
              date,
            });
            count++;
          }
        }
        await reload();
        notify.success(`Đã tạo ${count} lượt đặt.`);
      }
      close();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  const fillPrice = () => {
    const name = editingId ? editCourt : createCourts[0];
    const court = courts.find((c) => c.name === name);
    if (!court) {
      notify.error("Chọn sân trước khi tính tiền.");
      return;
    }
    const total = estimateBookingPrice(
      court.priceSlots,
      form.values.startTime,
      form.values.endTime
    );
    form.setFieldValue("totalPrice", total);
  };

  const changeStatus = async (b: Booking, status: BookingStatus) => {
    if (status === "cancelled") {
      setCancelTarget(b);
      setCancelReason("");
      return;
    }
    const { id, ...rest } = b;
    try {
      await update(id, { ...rest, status });
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    const { id, ...rest } = cancelTarget;
    try {
      await update(id, {
        ...rest,
        status: "cancelled",
        cancelReason: cancelReason.trim() || undefined,
      });
      setCancelTarget(null);
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const columns: DataTableColumn<Booking>[] = [
    { key: "code", header: "Mã", render: (b) => <Text fw={600}>{b.code}</Text> },
    {
      key: "customer",
      header: "Khách hàng",
      render: (b) => (
        <div>
          <Text size="sm" fw={500}>
            {b.customerName}
          </Text>
          <Anchor
            href={`tel:${b.customerPhone}`}
            size="xs"
            c="brand"
            onClick={(e) => e.stopPropagation()}
          >
            <Group gap={4} wrap="nowrap">
              <IconPhone size={12} />
              {b.customerPhone}
            </Group>
          </Anchor>
        </div>
      ),
    },
    { key: "court", header: "Sân", render: (b) => b.courtName },
    {
      key: "time",
      header: "Thời gian",
      render: (b) => (
        <div>
          <Text size="sm">{formatDate(b.date)}</Text>
          <Text size="xs" c="dimmed">
            {b.startTime} – {b.endTime}
          </Text>
        </div>
      ),
    },
    {
      key: "price",
      header: "Thành tiền",
      align: "right",
      render: (b) => formatVnd(b.totalPrice),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (b) => <StatusBadge status={b.status} reason={b.cancelReason} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 120,
      render: (b) => {
        const actions = NEXT_ACTIONS[b.status];
        return (
          <Group gap={4} justify="flex-end" wrap="nowrap">
            <Tooltip label="Sửa / đổi sân, giờ">
              <ActionIcon variant="subtle" onClick={() => openEdit(b)}>
                <IconPencil size={18} />
              </ActionIcon>
            </Tooltip>
            <Menu position="bottom-end" withinPortal disabled={actions.length === 0}>
              <Menu.Target>
                <Tooltip label={actions.length ? "Cập nhật trạng thái" : "Không có hành động"}>
                  <ActionIcon variant="subtle" disabled={actions.length === 0}>
                    <IconDots size={18} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Cập nhật trạng thái</Menu.Label>
                {actions.map((s) => (
                  <Menu.Item
                    key={s}
                    color={ACTION_META[s].color}
                    leftSection={ACTION_META[s].icon}
                    onClick={() => changeStatus(b, s)}
                  >
                    {ACTION_META[s].label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <ConfirmDeleteButton itemLabel={b.code} onConfirm={() => remove(b.id)} />
          </Group>
        );
      },
    },
  ];

  const isEdit = editingId !== null;

  return (
    <>
      <PageHeader
        title="Đặt sân"
        subtitle="Yêu cầu đặt sân của khách hàng"
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as ViewMode)}
              data={[
                { value: "list", label: "Danh sách" },
                { value: "calendar", label: "Lịch sân" },
              ]}
            />
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              Tạo lượt đặt
            </Button>
          </>
        }
      />

      {view === "list" ? (
        <>
          <Card mb="md" p="md">
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                label="Tìm kiếm"
                placeholder="Mã, khách, SĐT hoặc sân…"
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
                w={170}
                value={statusFilter}
                onChange={(v) => setStatusFilter((v as StatusFilter) ?? "all")}
                data={[
                  { value: "all", label: "Tất cả" },
                  ...Object.entries(STATUS_META).map(([value, m]) => ({
                    value,
                    label: (m as StatusMeta).label,
                  })),
                ]}
              />
              <TextInput
                label="Ngày"
                type="date"
                value={listDate}
                onChange={(e) => setListDate(e.currentTarget.value)}
              />
              {hasFilter && (
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={16} />}
                  onClick={clearFilters}
                >
                  Xóa lọc
                </Button>
              )}
            </Group>
          </Card>

          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(b) => b.id}
            loading={loading}
            emptyTitle={hasFilter ? "Không có lượt đặt khớp bộ lọc" : "Chưa có lượt đặt nào"}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </>
      ) : (
        <Stack>
          <Card p="md">
            <Group align="flex-end" justify="space-between" gap="lg" wrap="wrap">
              <TextInput
                label="Chọn ngày"
                type="date"
                value={calDate}
                onChange={(e) => setCalDate(e.currentTarget.value)}
              />
              <Text size="sm" c="dimmed">
                {formatDate(calDate)} · {calBookings.length} lượt đặt
              </Text>
              <CalendarLegend />
            </Group>
          </Card>
          <BookingCalendar courts={courts} bookings={calBookings} />
          <Text size="xs" c="dimmed">
            Di chuột vào ô để xem chi tiết lượt đặt. Lượt đã hủy / không đến không hiển thị.
          </Text>
        </Stack>
      )}

      {/* Modal tạo / sửa */}
      <Modal
        opened={opened}
        onClose={close}
        title={isEdit ? "Sửa lượt đặt" : "Tạo lượt đặt"}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Mã lượt đặt" {...form.getInputProps("code")} disabled={!isEdit} />
            <TextInput
              label="Tên khách hàng"
              required
              {...form.getInputProps("customerName")}
            />
            <TextInput
              label="Số điện thoại"
              required
              placeholder="0901234567"
              leftSection={<IconPhone size={16} />}
              {...form.getInputProps("customerPhone")}
            />
            {isEdit ? (
              <Select
                label="Sân"
                required
                data={courtOptions}
                searchable
                value={editCourt}
                onChange={(v) => setEditCourt(v ?? "")}
              />
            ) : (
              <MultiSelect
                label="Sân (chọn 1 hoặc nhiều)"
                required
                data={courtOptions}
                searchable
                value={createCourts}
                onChange={setCreateCourts}
              />
            )}
            <TextInput label="Ngày" type="date" {...form.getInputProps("date")} />
            <Group grow>
              <TextInput label="Giờ bắt đầu" type="time" {...form.getInputProps("startTime")} />
              <TextInput label="Giờ kết thúc" type="time" {...form.getInputProps("endTime")} />
            </Group>
            {!isEdit && (
              <Card withBorder p="sm" bg="var(--mantine-color-gray-0)">
                <Switch
                  label="Đặt định kỳ hàng tuần"
                  checked={repeatWeeks > 1}
                  onChange={(e) => setRepeatWeeks(e.currentTarget.checked ? 4 : 1)}
                />
                {repeatWeeks > 1 && (
                  <NumberInput
                    mt="xs"
                    label="Số tuần lặp"
                    min={2}
                    max={52}
                    value={repeatWeeks}
                    onChange={(v) => setRepeatWeeks(Number(v) || 2)}
                  />
                )}
                <Text size="xs" c="dimmed" mt={6}>
                  Tạo {Math.max(1, createCourts.length)} sân × {Math.max(1, repeatWeeks)} tuần ={" "}
                  {Math.max(1, createCourts.length) * Math.max(1, repeatWeeks)} lượt.
                </Text>
              </Card>
            )}
            <Group align="flex-end" gap="xs">
              <NumberInput
                label="Thành tiền (₫)"
                min={0}
                step={10000}
                thousandSeparator="."
                decimalSeparator=","
                style={{ flex: 1 }}
                {...form.getInputProps("totalPrice")}
              />
              <Button variant="light" onClick={fillPrice}>
                Tính theo bảng giá
              </Button>
            </Group>
            <Select
              label="Trạng thái"
              data={Object.entries(STATUS_META).map(([value, m]) => ({
                value,
                label: (m as StatusMeta).label,
              }))}
              {...form.getInputProps("status")}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" loading={saving}>
                {isEdit ? "Lưu" : "Tạo"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal hủy có lý do */}
      <Modal
        opened={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Hủy lượt đặt"
        centered
      >
        {cancelTarget && (
          <Stack>
            <Text size="sm">
              Hủy lượt <b>{cancelTarget.code}</b> — {cancelTarget.customerName} ({cancelTarget.courtName})?
            </Text>
            <Textarea
              label="Lý do hủy"
              placeholder="VD: khách báo bận, trùng lịch, thời tiết…"
              autosize
              minRows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCancelTarget(null)}>
                Đóng
              </Button>
              <Button color="red" onClick={confirmCancel}>
                Xác nhận hủy
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}

function StatusBadge({ status, reason }: { status: BookingStatus; reason?: string }) {
  const meta = STATUS_META[status];
  const badge = (
    <Badge variant="light" color={meta.color}>
      {meta.label}
    </Badge>
  );
  return status === "cancelled" && reason ? (
    <Tooltip label={`Lý do: ${reason}`}>{badge}</Tooltip>
  ) : (
    badge
  );
}
