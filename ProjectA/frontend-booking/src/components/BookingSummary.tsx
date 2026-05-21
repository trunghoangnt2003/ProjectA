import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  CopyButton,
  Divider,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCalendarCheck,
  IconCircleCheck,
  IconCopy,
  IconCheck,
  IconTag,
} from "@tabler/icons-react";
import type { BookingExtra, Court, ExtraItem, PaymentMethod } from "../types/domain";
import { slotStart, slotEnd, slotsToHours } from "../lib/time";
import { courtTotal, extrasTotal, surchargeLabel } from "../lib/pricing";
import { formatVnd } from "../lib/format";
import { toRanges } from "../lib/selection";
import { bookingService } from "../services/bookingService";
import { extrasService } from "../services/extrasService";
import { promotionService } from "../services/promotionService";
import { memberDiscountPercent, membershipName } from "../services/membershipService";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { notify } from "../lib/notify";
import { ExtrasPicker } from "./ExtrasPicker";

interface BookingSummaryProps {
  date: string;
  courts: Court[];
  selected: Set<string>;
  onConfirmed: () => void;
}

const PAYMENT_OPTS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tại quầy" },
  { value: "qr", label: "QR Banking" },
  { value: "ewallet", label: "Ví điện tử" },
  { value: "card", label: "Thẻ" },
];

export function BookingSummary({ date, courts, selected, onConfirmed }: BookingSummaryProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultOpen, { open: openResult, close: closeResult }] = useDisclosure(false);
  const [result, setResult] = useState<{ code: string; court: string; time: string }[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
  const [extrasQty, setExtrasQty] = useState<Record<string, number>>({});
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("cash");

  const { customer } = useCustomerAuth();
  const memberPct = customer ? memberDiscountPercent(customer.membershipLevel) : 0;

  useEffect(() => {
    extrasService.list().then(setExtraItems);
  }, []);

  const courtById = useMemo(() => new Map(courts.map((c) => [c.id, c])), [courts]);

  const items = useMemo(
    () =>
      toRanges(selected).map((r) => {
        const court = courtById.get(r.courtId)!;
        return {
          ...r,
          court,
          timeLabel: `${slotStart(r.startSlot)} – ${slotEnd(r.endSlot - 1)}`,
          hours: slotsToHours(r.startSlot, r.endSlot),
          price: courtTotal(court, r.startSlot, r.endSlot, date),
          surcharge: surchargeLabel(court, date),
        };
      }),
    [selected, courtById, date]
  );

  const has = items.length > 0;
  const subtotalCourt = items.reduce((s, i) => s + i.price, 0);

  const extraLines: BookingExtra[] = useMemo(
    () =>
      extraItems
        .filter((it) => (extrasQty[it.id] ?? 0) > 0)
        .map((it) => ({ id: it.id, name: it.name, price: it.price, quantity: extrasQty[it.id] })),
    [extraItems, extrasQty]
  );
  const extrasSum = extrasTotal(extraLines);
  const subtotal = subtotalCourt + extrasSum;
  const memberDiscount = Math.round((subtotal * memberPct) / 100);
  const voucherDiscount = voucher ? Math.min(voucher.discount, subtotal) : 0;
  const discount = Math.min(memberDiscount + voucherDiscount, subtotal);
  const total = subtotal - discount;

  const setQty = (id: string, qty: number) =>
    setExtrasQty((prev) => {
      if (qty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: qty };
    });

  const applyVoucher = async () => {
    if (!voucherInput.trim()) return;
    const res = await promotionService.validate(voucherInput, subtotal);
    setVoucherMsg({ ok: res.ok, text: res.message });
    setVoucher(res.ok && res.voucher ? { code: res.voucher.code, discount: res.discount } : null);
  };

  const form = useForm({
    initialValues: { customerName: "", phone: "" },
    validate: {
      customerName: (v) => (v.trim() ? null : "Nhập họ tên"),
      phone: (v) => (/^\d{9,11}$/.test(v) ? null : "Số điện thoại không hợp lệ"),
    },
  });

  const reset = () => {
    form.reset();
    setExtrasQty({});
    setVoucher(null);
    setVoucherInput("");
    setVoucherMsg(null);
    setPayment("cash");
  };

  const confirm = form.onSubmit(async (values) => {
    if (!has) return;
    setSaving(true);
    try {
      const created: { code: string; court: string; time: string }[] = [];
      for (let idx = 0; idx < items.length; idx++) {
        const i = items[idx];
        const isFirst = idx === 0;
        const b = await bookingService.create({
          date,
          courtId: i.courtId,
          startSlot: i.startSlot,
          endSlot: i.endSlot,
          customerName: values.customerName,
          phone: values.phone,
          // Dịch vụ kèm + giảm giá gắn vào lượt đầu (order-level); các lượt còn lại chỉ tiền sân.
          totalPrice: isFirst ? i.price + extrasSum - discount : i.price,
          paymentMethod: payment,
          extras: isFirst && extraLines.length ? extraLines : undefined,
          voucherCode: isFirst && voucher ? voucher.code : undefined,
          discount: isFirst && discount ? discount : undefined,
        });
        created.push({ code: b.code, court: i.court.name, time: i.timeLabel });
      }
      notify.success(`Đã đặt ${created.length} khung giờ.`);
      setResult(created);
      setOrderTotal(total);
      reset();
      close();
      openResult();
      onConfirmed();
    } finally {
      setSaving(false);
    }
  });

  return (
    <Card>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Khung giờ đã chọn</Text>
        {has && <Text size="sm" c="dimmed">{items.length} mục</Text>}
      </Group>

      {!has ? (
        <Text size="sm" c="dimmed">Bấm vào các ô trống trên lưới để chọn khung giờ muốn đặt.</Text>
      ) : (
        <Stack gap="xs">
          <ScrollArea.Autosize mah={220}>
            <Stack gap={8}>
              {items.map((i) => (
                <Group key={`${i.courtId}-${i.startSlot}`} justify="space-between" wrap="nowrap">
                  <div>
                    <Text size="sm" fw={500}>{i.court.name}</Text>
                    <Text size="xs" c="dimmed">
                      {i.timeLabel} · {i.hours}h{i.surcharge ? ` · ${i.surcharge}` : ""}
                    </Text>
                  </div>
                  <Text size="sm" fw={500}>{formatVnd(i.price)}</Text>
                </Group>
              ))}
            </Stack>
          </ScrollArea.Autosize>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Tiền sân</Text>
            <Text fw={800} c="accent.6" fz="xl">{formatVnd(subtotalCourt)}</Text>
          </Group>
        </Stack>
      )}

      <Button
        fullWidth mt="md" size="md" color="accent"
        leftSection={<IconCalendarCheck size={18} />}
        disabled={!has}
        onClick={() => {
          if (customer) form.setValues({ customerName: customer.name, phone: customer.phone });
          open();
        }}
      >
        Tiếp theo
      </Button>

      {/* Checkout: dịch vụ kèm + voucher + thanh toán */}
      <Modal opened={opened} onClose={close} title="Hoàn tất đặt sân" centered size="lg">
        <Stack>
          <div>
            <Text fw={600} mb={4}>Sân & khung giờ</Text>
            <Stack gap={4}>
              {items.map((i) => (
                <Group key={`${i.courtId}-${i.startSlot}`} justify="space-between">
                  <Text size="sm">{i.court.name} · {i.timeLabel}{i.surcharge ? ` (${i.surcharge})` : ""}</Text>
                  <Text size="sm" fw={500}>{formatVnd(i.price)}</Text>
                </Group>
              ))}
            </Stack>
          </div>

          <Divider label="Dịch vụ đặt kèm" labelPosition="left" />
          <ScrollArea.Autosize mah={220}>
            <ExtrasPicker items={extraItems} value={extrasQty} onChange={setQty} />
          </ScrollArea.Autosize>

          <Divider label="Mã khuyến mãi" labelPosition="left" />
          <Group align="flex-end" gap="xs">
            <TextInput
              style={{ flex: 1 }}
              placeholder="VD: SUMMER10"
              leftSection={<IconTag size={16} />}
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.currentTarget.value)}
            />
            <Button variant="light" onClick={applyVoucher}>Áp dụng</Button>
          </Group>
          {voucherMsg && (
            <Text size="xs" c={voucherMsg.ok ? "teal" : "red"}>{voucherMsg.text}</Text>
          )}

          <Divider label="Thanh toán" labelPosition="left" />
          <SegmentedControl
            fullWidth
            data={PAYMENT_OPTS}
            value={payment}
            onChange={(v) => setPayment(v as PaymentMethod)}
          />

          <form onSubmit={confirm}>
            <Stack>
              <Group grow>
                <TextInput label="Họ tên" required {...form.getInputProps("customerName")} />
                <TextInput label="Số điện thoại" required {...form.getInputProps("phone")} />
              </Group>

              <Card withBorder bg="var(--mantine-color-gray-0)" p="sm">
                <Row label="Tiền sân" value={formatVnd(subtotalCourt)} />
                {extrasSum > 0 && <Row label="Dịch vụ kèm" value={formatVnd(extrasSum)} />}
                {memberDiscount > 0 && customer && (
                  <Row label={`Ưu đãi ${membershipName(customer.membershipLevel)} (${memberPct}%)`} value={`− ${formatVnd(memberDiscount)}`} accent="teal" />
                )}
                {voucherDiscount > 0 && <Row label="Mã giảm giá" value={`− ${formatVnd(voucherDiscount)}`} accent="teal" />}
                <Divider my={6} />
                <Group justify="space-between">
                  <Text fw={700}>Tổng thanh toán</Text>
                  <Text fw={800} c="accent.6" fz="xl">{formatVnd(total)}</Text>
                </Group>
              </Card>

              <Group justify="flex-end" mt="xs">
                <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
                <Button type="submit" color="accent" loading={saving}>Xác nhận đặt</Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Modal>

      {/* Kết quả */}
      <Modal opened={resultOpen} onClose={closeResult} title="Đặt sân thành công" centered>
        <Stack align="center" gap="xs" mb="md">
          <ThemeIcon size={56} radius="xl" color="brand" variant="light">
            <IconCircleCheck size={34} />
          </ThemeIcon>
          <Text fw={700} fz="lg">Đã gửi yêu cầu đặt sân!</Text>
          <Text size="sm" c="dimmed" ta="center">
            Lưu lại <b>mã đặt sân</b> để tra cứu. Yêu cầu đang ở trạng thái “Chờ xác nhận”.
          </Text>
          <Badge size="lg" variant="light" color="accent">Tổng: {formatVnd(orderTotal)}</Badge>
        </Stack>

        <Stack gap="sm">
          {result.map((r) => (
            <Group key={r.code} justify="space-between" wrap="nowrap">
              <div>
                <CopyButton value={r.code}>
                  {({ copied, copy }) => (
                    <Group gap={6}>
                      <Code fz="md" fw={700} c="accent.6">{r.code}</Code>
                      <Button
                        size="compact-xs" variant="subtle"
                        color={copied ? "teal" : "gray"}
                        leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        onClick={copy}
                      >
                        {copied ? "Đã chép" : "Chép"}
                      </Button>
                    </Group>
                  )}
                </CopyButton>
                <Text size="xs" c="dimmed">{r.court} · {r.time}</Text>
              </div>
            </Group>
          ))}
        </Stack>

        <Button fullWidth mt="lg" onClick={closeResult}>Đóng</Button>
      </Modal>
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={500} c={accent}>{value}</Text>
    </Group>
  );
}
