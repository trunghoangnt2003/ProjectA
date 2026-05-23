import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  List,
  Loader,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil, IconCheck, IconCrown, IconSearch } from "@tabler/icons-react";
import { PageHeader, ConfirmDeleteButton, EmptyState } from "../common";
import { usePagedResource } from "../../hooks/usePagedResource";
import { membershipService } from "../../services/membershipService";
import type { MembershipLevel, MembershipPlan } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const LEVEL_META: Record<MembershipLevel, { label: string; color: string }> = {
  basic: { label: "Basic", color: "gray" },
  silver: { label: "Silver", color: "blue" },
  gold: { label: "Gold", color: "yellow" },
  platinum: { label: "Platinum", color: "violet" },
};
const LEVEL_ORDER: MembershipLevel[] = ["basic", "silver", "gold", "platinum"];

interface PlanForm {
  level: MembershipLevel;
  name: string;
  price: number;
  durationDays: number;
  discountPercent: number;
  benefitsText: string; // mỗi dòng = 1 quyền lợi
  active: boolean;
}

const emptyForm: PlanForm = {
  level: "silver",
  name: "",
  price: 0,
  durationDays: 90,
  discountPercent: 0,
  benefitsText: "",
  active: true,
};

export function MembershipSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, create, update, remove, search, setSearch, page, setPage, totalPages, totalCount } = usePagedResource(
    membershipService,
    {},
    {
      created: "Đã tạo gói thành viên.",
      updated: "Đã cập nhật.",
      removed: "Đã xóa gói.",
    }
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<PlanForm>({
    initialValues: emptyForm,
    validate: { name: (v) => (v.trim() ? null : "Nhập tên gói") },
  });

  const sorted = [...data].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm);
    open();
  };

  const openEdit = (p: MembershipPlan) => {
    setEditingId(p.id);
    form.setValues({
      level: p.level,
      name: p.name,
      price: p.price,
      durationDays: p.durationDays,
      discountPercent: p.discountPercent,
      benefitsText: p.benefits.join("\n"),
      active: p.active,
    });
    open();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const payload: Omit<MembershipPlan, "id"> = {
      level: values.level,
      name: values.name.trim(),
      price: values.price,
      durationDays: values.durationDays,
      discountPercent: values.discountPercent,
      benefits: values.benefitsText.split("\n").map((s) => s.trim()).filter(Boolean),
      active: values.active,
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

  return (
    <>
      <PageHeader
        title="Thành viên"
        subtitle="Gói hội viên theo cấp độ — giá, hạn dùng & quyền lợi"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Tạo gói
          </Button>
        }
      />

      <Card mb="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Tìm kiếm"
            placeholder="Tên gói hoặc cấp độ..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchQuery);
            }}
            onBlur={() => setSearch(searchQuery)}
            style={{ flex: 1, minWidth: 220 }}
          />
        </Group>
      </Card>

      {loading ? (
        <Center py="xl"><Loader /></Center>
      ) : sorted.length === 0 ? (
        <Card p={0}><EmptyState title="Chưa có gói thành viên" /></Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {sorted.map((p) => {
            const meta = LEVEL_META[p.level];
            return (
              <Card key={p.id} withBorder shadow="sm" style={{ opacity: p.active ? 1 : 0.6 }}>
                <Group justify="space-between" mb="xs">
                  <Badge size="lg" variant="light" color={meta.color} leftSection={<IconCrown size={14} />}>
                    {meta.label}
                  </Badge>
                  <Group gap={2} wrap="nowrap">
                    <Tooltip label="Sửa">
                      <ActionIcon variant="subtle" onClick={() => openEdit(p)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <ConfirmDeleteButton itemLabel={p.name} onConfirm={() => remove(p.id)} />
                  </Group>
                </Group>

                <Text fw={600}>{p.name}</Text>
                <Text size="xl" fw={700} c="brand" mt={4}>
                  {p.price > 0 ? formatVnd(p.price) : "Miễn phí"}
                </Text>
                <Text size="xs" c="dimmed">
                  {p.durationDays > 0 ? `Hạn ${p.durationDays} ngày` : "Không giới hạn"}
                  {p.discountPercent > 0 ? ` · giảm ${p.discountPercent}%` : ""}
                </Text>

                <List spacing={4} size="sm" mt="sm" center icon={
                  <ThemeIcon color={meta.color} size={16} radius="xl"><IconCheck size={11} /></ThemeIcon>
                }>
                  {p.benefits.map((b, i) => (
                    <List.Item key={i}>{b}</List.Item>
                  ))}
                </List>

                {!p.active && (
                  <Badge mt="sm" color="gray" variant="light" fullWidth>Ngừng bán</Badge>
                )}
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={close} title={editingId ? "Sửa gói thành viên" : "Tạo gói thành viên"} centered>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Select
              label="Cấp độ"
              data={LEVEL_ORDER.map((l) => ({ value: l, label: LEVEL_META[l].label }))}
              {...form.getInputProps("level")}
            />
            <TextInput label="Tên gói" required {...form.getInputProps("name")} />
            <Group grow>
              <NumberInput label="Giá (₫)" min={0} step={50000} thousandSeparator="." decimalSeparator="," {...form.getInputProps("price")} />
              <NumberInput label="Hạn dùng (ngày)" min={0} {...form.getInputProps("durationDays")} />
            </Group>
            <NumberInput label="Giảm cho thành viên (%)" min={0} max={100} {...form.getInputProps("discountPercent")} />
            <Textarea
              label="Quyền lợi (mỗi dòng một mục)"
              autosize
              minRows={3}
              placeholder={"Giảm 10% đặt sân\nTích điểm x1.5"}
              {...form.getInputProps("benefitsText")}
            />
            <Switch label="Đang bán" {...form.getInputProps("active", { type: "checkbox" })} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
              <Button type="submit" loading={saving}>{editingId ? "Lưu" : "Tạo"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
