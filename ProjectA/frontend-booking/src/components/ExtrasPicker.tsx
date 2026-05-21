import { useMemo } from "react";
import { ActionIcon, Badge, Group, Stack, Text } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import type { ExtraItem } from "../types/domain";
import { formatVnd } from "../lib/format";

interface ExtrasPickerProps {
  items: ExtraItem[];
  /** id -> số lượng */
  value: Record<string, number>;
  onChange: (id: string, qty: number) => void;
}

/** Chọn dịch vụ/đồ ăn-uống đặt kèm, nhóm theo loại, có nút +/-. */
export function ExtrasPicker({ items, value, onChange }: ExtrasPickerProps) {
  const groups = useMemo(() => {
    const map = new Map<string, ExtraItem[]>();
    for (const it of items) {
      (map.get(it.group) ?? map.set(it.group, []).get(it.group)!).push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <Stack gap="md">
      {groups.map(([group, list]) => (
        <div key={group}>
          <Text size="sm" fw={600} c="dimmed" mb={6}>{group}</Text>
          <Stack gap={6}>
            {list.map((it) => {
              const qty = value[it.id] ?? 0;
              return (
                <Group key={it.id} justify="space-between" wrap="nowrap">
                  <div style={{ minWidth: 0 }}>
                    <Text size="sm" lineClamp={1}>{it.name}</Text>
                    <Text size="xs" c="dimmed">
                      {formatVnd(it.price)}{it.unit ? ` · ${it.unit}` : ""}
                    </Text>
                  </div>
                  <Group gap={6} wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="default"
                      disabled={qty === 0}
                      onClick={() => onChange(it.id, qty - 1)}
                      aria-label="Giảm"
                    >
                      <IconMinus size={14} />
                    </ActionIcon>
                    {qty > 0 ? (
                      <Badge variant="light" color="accent" w={28}>{qty}</Badge>
                    ) : (
                      <Text size="sm" w={28} ta="center" c="dimmed">0</Text>
                    )}
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="accent"
                      onClick={() => onChange(it.id, qty + 1)}
                      aria-label="Thêm"
                    >
                      <IconPlus size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        </div>
      ))}
    </Stack>
  );
}
