import type { ReactNode } from "react";
import { Group, Stack, Text, Title } from "@mantine/core";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Nút hành động bên phải (Tạo mới, Xuất...). */
  actions?: ReactNode;
}

/**
 * Tiêu đề chuẩn cho mỗi trang/module. Luôn đặt ở đầu nội dung trang.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" wrap="wrap">
      <Stack gap={2}>
        <Title order={3}>{title}</Title>
        {subtitle && (
          <Text c="dimmed" size="sm">
            {subtitle}
          </Text>
        )}
      </Stack>
      {actions && <Group gap="sm">{actions}</Group>}
    </Group>
  );
}
