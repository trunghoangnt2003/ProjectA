import type { ReactNode } from "react";
import { AppShell, Avatar, Button, Group, NavLink, ScrollArea, Stack, Text } from "@mantine/core";
import { IconFeather, IconLogout2, IconArrowLeft } from "@tabler/icons-react";
import type { PosNavItem } from "./posNav";

interface PosLayoutProps {
  navItems: PosNavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  onExit: () => void; // quay về admin
  userEmail?: string;
  title: string;
  children: ReactNode;
}

/**
 * Khung POS cho nhân viên trực quầy — touchscreen: nút lớn, ít cấp, màu đậm
 * để phân biệt với admin. Dùng chung auth/permission/services với admin.
 */
export function PosLayout({
  navItems,
  activeKey,
  onNavigate,
  onExit,
  userEmail,
  title,
  children,
}: PosLayoutProps) {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 220, breakpoint: "xs" }} padding="md">
      <AppShell.Header bg="var(--mantine-color-dark-7)" c="white">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <IconFeather size={26} />
            <Text fw={700} size="lg">POS · Sân Cầu Lông</Text>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" visibleFrom="sm">{title}</Text>
            <Avatar color="teal" radius="xl" size={32}>
              {(userEmail ?? "?").charAt(0).toUpperCase()}
            </Avatar>
            <Button size="xs" variant="white" color="dark" leftSection={<IconArrowLeft size={14} />} onClick={onExit}>
              Thoát POS
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={6}>
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                active={item.key === activeKey}
                label={<Text fw={600} size="md">{item.label}</Text>}
                leftSection={item.icon}
                onClick={() => onNavigate(item.key)}
                variant="filled"
                color="teal"
                style={{ borderRadius: "var(--mantine-radius-md)", paddingTop: 12, paddingBottom: 12 }}
              />
            ))}
          </Stack>
        </AppShell.Section>
        <AppShell.Section>
          <Button fullWidth variant="light" color="gray" leftSection={<IconLogout2 size={16} />} onClick={onExit}>
            Về trang quản trị
          </Button>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="var(--mantine-color-gray-0)">{children}</AppShell.Main>
    </AppShell>
  );
}
