import { useState } from "react";
import { ActionIcon, Badge, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconArrowRight, IconCheck, IconTrash } from "@tabler/icons-react";
import { useCrudResource } from "../../hooks/useCrudResource";
import { taskService } from "../../services/taskService";
import type { StaffTask, TaskStatus } from "../../types/domain";
import { toMessage, notify } from "../../lib/notify";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "pending", label: "Chờ làm", color: "gray" },
  { status: "in-progress", label: "Đang làm", color: "blue" },
  { status: "done", label: "Hoàn thành", color: "teal" },
];
const CATEGORIES = ["Vệ sinh sân", "Setup sân", "Khác"];
const NEXT: Record<TaskStatus, TaskStatus | null> = { pending: "in-progress", "in-progress": "done", done: null };

export function StaffTasks() {
  const { data, loading, create, update, remove } = useCrudResource(taskService, {
    created: "Đã thêm việc.", removed: "Đã xóa việc.",
  });
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Vệ sinh sân");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  const advance = async (t: StaffTask) => {
    const next = NEXT[t.status];
    if (!next) return;
    const { id, ...rest } = t;
    try { await update(id, { ...rest, status: next }); } catch (e) { notify.error(toMessage(e)); }
  };

  const submit = async () => {
    if (!title.trim()) return notify.error("Nhập tên công việc.");
    setSaving(true);
    try {
      await create({ title: title.trim(), category, assignee: assignee.trim() || undefined, status: "pending", createdAt: new Date().toISOString() });
      setTitle(""); setAssignee("");
      close();
    } catch (e) { notify.error(toMessage(e)); } finally { setSaving(false); }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={700} size="xl">Công việc nhân viên</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>Thêm việc</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {COLUMNS.map((col) => {
          const items = data.filter((t) => t.status === col.status);
          return (
            <Card key={col.status} withBorder bg="var(--mantine-color-gray-0)">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>{col.label}</Text>
                <Badge color={col.color} variant="light">{items.length}</Badge>
              </Group>
              <Stack gap="xs">
                {items.length === 0 && <Text size="sm" c="dimmed">—</Text>}
                {items.map((t) => (
                  <Card key={t.id} withBorder p="sm">
                    <Group justify="space-between" wrap="nowrap" align="flex-start">
                      <div>
                        <Text size="sm" fw={500}>{t.title}</Text>
                        <Group gap={6} mt={4}>
                          <Badge size="xs" variant="light">{t.category}</Badge>
                          {t.assignee && <Text size="xs" c="dimmed">{t.assignee}</Text>}
                        </Group>
                      </div>
                      <Group gap={2} wrap="nowrap">
                        {NEXT[t.status] && (
                          <ActionIcon variant="light" color={col.status === "in-progress" ? "teal" : "blue"} onClick={() => advance(t)} aria-label="Tiến độ">
                            {col.status === "in-progress" ? <IconCheck size={16} /> : <IconArrowRight size={16} />}
                          </ActionIcon>
                        )}
                        <ActionIcon variant="subtle" color="red" onClick={() => remove(t.id)} aria-label="Xóa"><IconTrash size={16} /></ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
      {loading && <Text size="sm" c="dimmed">Đang tải…</Text>}

      <Modal opened={opened} onClose={close} title="Thêm công việc" centered>
        <Stack>
          <TextInput label="Công việc" required value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
          <Select label="Loại" data={CATEGORIES} value={category} onChange={(v) => setCategory(v ?? "Khác")} />
          <TextInput label="Người làm (tùy chọn)" value={assignee} onChange={(e) => setAssignee(e.currentTarget.value)} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close} disabled={saving}>Hủy</Button>
            <Button onClick={submit} loading={saving}>Thêm</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
