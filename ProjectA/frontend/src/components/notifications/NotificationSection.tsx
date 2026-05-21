import { useEffect, useMemo, useState } from "react";
import {
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
  Tabs,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconSend, IconMessage, IconBell } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { useCrudResource } from "../../hooks/useCrudResource";
import { automationService, notificationService } from "../../services/notificationService";
import type {
  AppNotification,
  AutomationRule,
  NotificationChannel,
  NotificationStatus,
} from "../../types/domain";
import { formatDateTime } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const CHANNEL_META: Record<NotificationChannel, { label: string; color: string }> = {
  email: { label: "Email", color: "blue" },
  sms: { label: "SMS", color: "teal" },
  push: { label: "Push", color: "grape" },
  zalo: { label: "Zalo OA", color: "indigo" },
};
const CHANNEL_OPTIONS = Object.entries(CHANNEL_META).map(([value, m]) => ({ value, label: m.label }));

const STATUS_META: Record<NotificationStatus, { label: string; color: string }> = {
  sent: { label: "Đã gửi", color: "teal" },
  scheduled: { label: "Đã lên lịch", color: "blue" },
  failed: { label: "Thất bại", color: "red" },
};

interface SendForm {
  channel: NotificationChannel;
  audience: string;
  title: string;
  message: string;
  recipients: number;
  schedule: boolean;
}

export function NotificationSection() {
  const { data: notifs, loading, create } = useCrudResource(notificationService, {
    created: "Đã tạo thông báo.",
  });
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "all">("all");

  const loadRules = () => automationService.list().then(setRules).catch((e) => notify.error(toMessage(e)));
  useEffect(() => { loadRules(); }, []);

  const stats = useMemo(() => ({
    sent: notifs.filter((n) => n.status === "sent").length,
    scheduled: notifs.filter((n) => n.status === "scheduled").length,
    reach: notifs.filter((n) => n.status === "sent").reduce((s, n) => s + n.recipients, 0),
  }), [notifs]);

  const view = useMemo(
    () =>
      notifs
        .filter((n) => channelFilter === "all" || n.channel === channelFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifs, channelFilter]
  );

  const form = useForm<SendForm>({
    initialValues: { channel: "zalo", audience: "Tất cả khách", title: "", message: "", recipients: 100, schedule: false },
    validate: {
      title: (v) => (v.trim() ? null : "Nhập tiêu đề"),
      message: (v) => (v.trim() ? null : "Nhập nội dung"),
    },
  });

  const submitSend = form.onSubmit(async (values) => {
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await create({
        channel: values.channel,
        title: values.title.trim(),
        audience: values.audience.trim() || "Tất cả khách",
        message: values.message.trim(),
        status: values.schedule ? "scheduled" : "sent",
        recipients: values.schedule ? values.recipients : values.recipients,
        createdAt: now,
        sentAt: values.schedule ? undefined : now,
      });
      notify.success(values.schedule ? "Đã lên lịch gửi." : "Đã gửi thông báo.");
      form.reset();
      close();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  const toggleRule = async (r: AutomationRule) => {
    const { id, ...rest } = r;
    try {
      await automationService.update(id, { ...rest, enabled: !r.enabled });
      loadRules();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const setRuleChannel = async (r: AutomationRule, channel: NotificationChannel) => {
    const { id, ...rest } = r;
    try {
      await automationService.update(id, { ...rest, channel });
      loadRules();
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const columns: DataTableColumn<AppNotification>[] = [
    { key: "time", header: "Thời gian", render: (n) => <Text size="xs" c="dimmed">{formatDateTime(n.createdAt)}</Text> },
    { key: "channel", header: "Kênh", render: (n) => <Badge variant="light" color={CHANNEL_META[n.channel].color}>{CHANNEL_META[n.channel].label}</Badge> },
    {
      key: "title",
      header: "Nội dung",
      render: (n) => (
        <div>
          <Text size="sm" fw={500}>{n.title}</Text>
          <Text size="xs" c="dimmed" lineClamp={1}>{n.message}</Text>
        </div>
      ),
    },
    { key: "audience", header: "Đối tượng", render: (n) => n.audience },
    { key: "recipients", header: "Người nhận", align: "right", render: (n) => n.recipients.toLocaleString("vi-VN") },
    { key: "status", header: "Trạng thái", render: (n) => <Badge variant="light" color={STATUS_META[n.status].color}>{STATUS_META[n.status].label}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Thông báo"
        subtitle="Gửi & tự động hóa thông báo qua Email / SMS / Push / Zalo OA"
        actions={
          <Button leftSection={<IconSend size={16} />} onClick={open}>
            Gửi thông báo
          </Button>
        }
      />

      <Tabs defaultValue="history">
        <Tabs.List mb="md">
          <Tabs.Tab value="history">Lịch sử gửi</Tabs.Tab>
          <Tabs.Tab value="automation">Tự động hóa</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="history">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
            <StatCard label="Đã gửi" value={stats.sent} icon={<IconSend size={26} />} color="teal" />
            <StatCard label="Đã lên lịch" value={stats.scheduled} icon={<IconBell size={26} />} color="blue" />
            <StatCard label="Tổng lượt tiếp cận" value={stats.reach.toLocaleString("vi-VN")} icon={<IconMessage size={26} />} color="grape" />
          </SimpleGrid>

          <Card mb="md" p="md">
            <Select
              label="Kênh"
              w={180}
              value={channelFilter}
              onChange={(v) => setChannelFilter((v as NotificationChannel | "all") ?? "all")}
              data={[{ value: "all", label: "Tất cả kênh" }, ...CHANNEL_OPTIONS]}
            />
          </Card>

          <DataTable data={view} columns={columns} rowKey={(n) => n.id} loading={loading} emptyTitle="Chưa có thông báo nào" />
        </Tabs.Panel>

        <Tabs.Panel value="automation">
          <Stack>
            {rules.map((r) => (
              <Card key={r.id} withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Text fw={600}>{r.name}</Text>
                      <Badge size="xs" variant="light" color={CHANNEL_META[r.channel].color}>
                        {CHANNEL_META[r.channel].label}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">{r.description}</Text>
                  </div>
                  <Group gap="md" wrap="nowrap">
                    <Select
                      size="xs"
                      w={120}
                      data={CHANNEL_OPTIONS}
                      value={r.channel}
                      onChange={(v) => v && setRuleChannel(r, v as NotificationChannel)}
                    />
                    <Switch checked={r.enabled} onChange={() => toggleRule(r)} />
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={close} title="Gửi thông báo" centered>
        <form onSubmit={submitSend}>
          <Stack>
            <Select label="Kênh" data={CHANNEL_OPTIONS} {...form.getInputProps("channel")} />
            <TextInput label="Đối tượng" placeholder="Tất cả khách / VIP / Khách quen…" {...form.getInputProps("audience")} />
            <TextInput label="Tiêu đề" required {...form.getInputProps("title")} />
            <Textarea label="Nội dung" required autosize minRows={3} {...form.getInputProps("message")} />
            <NumberInput label="Số người nhận (ước tính)" min={0} {...form.getInputProps("recipients")} />
            <Switch label="Lên lịch gửi sau (thay vì gửi ngay)" {...form.getInputProps("schedule", { type: "checkbox" })} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
              <Button type="submit" loading={saving} leftSection={<IconSend size={16} />}>
                {form.values.schedule ? "Lên lịch" : "Gửi ngay"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
