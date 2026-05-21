import type { ReactNode } from "react";
import { Stack, Text, ThemeIcon } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Trạng thái rỗng dùng chung cho danh sách/bảng không có dữ liệu.
 */
export function EmptyState({
  title = "Chưa có dữ liệu",
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="xs" py="xl" c="dimmed">
      <ThemeIcon size={56} radius="xl" variant="light" color="gray">
        {icon ?? <IconInbox size={28} />}
      </ThemeIcon>
      <Text fw={600} c="dark">
        {title}
      </Text>
      {description && (
        <Text size="sm" ta="center" maw={360}>
          {description}
        </Text>
      )}
      {action}
    </Stack>
  );
}
