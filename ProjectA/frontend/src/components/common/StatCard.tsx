import type { ReactNode } from "react";
import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import type { MantineColor } from "@mantine/core";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  color?: MantineColor;
  /** Mô tả phụ dưới giá trị, vd "so với tháng trước". */
  hint?: string;
}

/**
 * Thẻ chỉ số cho dashboard (số sân trống, lượt đặt hôm nay, doanh thu...).
 */
export function StatCard({
  label,
  value,
  icon,
  color = "brand",
  hint,
}: StatCardProps) {
  return (
    <Card>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="sm" c="dimmed" fw={500}>
            {label}
          </Text>
          <Text fz={28} fw={700} lh={1.2} mt={4}>
            {value}
          </Text>
          {hint && (
            <Text size="xs" c="dimmed" mt={6}>
              {hint}
            </Text>
          )}
        </div>
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}
