import type { ReactNode } from "react";
import {
  AppShell,
  Badge,
  Burger,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
  UnstyledButton,
  Avatar,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { IconLogout, IconChevronDown, IconFeather, IconCashRegister } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import { usePermissions } from "../../hooks/usePermissions";

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Module chưa có API/back-end — hiển thị mờ + nhãn "Sắp có". */
  disabled?: boolean;
  /** Quyền tối thiểu để thấy & mở module. Bỏ trống = ai cũng vào được. */
  permission?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface AppLayoutProps {
  brand?: string;
  navGroups: NavGroup[];
  activeKey: string;
  onNavigate: (key: string) => void;
  userEmail?: string;
  onLogout: () => void;
  /** Tiêu đề module đang mở, hiển thị ở topbar. */
  title: string;
  children: ReactNode;
}

export function AppLayout({
  brand = "Sân Cầu Lông",
  navGroups,
  activeKey,
  onNavigate,
  userEmail,
  onLogout,
  title,
  children,
}: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { can } = usePermissions();

  const handleNavigate = (key: string) => {
    onNavigate(key);
    close();
  };

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} fw={600} visibleFrom="sm">
              {title}
            </Title>
          </Group>

          <Group gap="sm" wrap="nowrap">
          {can("pos.use") && (
            <Button
              variant="light"
              color="teal"
              leftSection={<IconCashRegister size={16} />}
              onClick={() => navigate("/pos")}
            >
              Mở POS
            </Button>
          )}
          <Menu position="bottom-end" width={200} withArrow>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs" wrap="nowrap">
                  <Avatar color="brand" radius="xl" size={34}>
                    {(userEmail ?? "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500} visibleFrom="sm" maw={180} truncate>
                    {userEmail}
                  </Text>
                  <IconChevronDown size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{userEmail}</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={onLogout}
              >
                Đăng xuất
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Group gap="xs" mb="md" px="xs">
          <IconFeather size={26} color="var(--mantine-color-brand-6)" />
          <Text fw={700} size="lg">
            {brand}
          </Text>
        </Group>

        <AppShell.Section grow component={ScrollArea}>
          <Stack gap="lg">
            {navGroups.map((group, gi) => (
              <div key={group.label ?? gi}>
                {group.label && (
                  <Text
                    size="xs"
                    tt="uppercase"
                    fw={700}
                    c="dimmed"
                    px="xs"
                    mb={rem(6)}
                  >
                    {group.label}
                  </Text>
                )}
                <Stack gap={4}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.key}
                      active={item.key === activeKey}
                      label={item.label}
                      leftSection={item.icon}
                      disabled={item.disabled}
                      onClick={() => handleNavigate(item.key)}
                      rightSection={
                        item.disabled ? (
                          <Badge size="xs" variant="light" color="gray">
                            Sắp có
                          </Badge>
                        ) : undefined
                      }
                      variant="filled"
                      style={{ borderRadius: "var(--mantine-radius-md)" }}
                    />
                  ))}
                </Stack>
              </div>
            ))}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="var(--mantine-color-gray-0)">{children}</AppShell.Main>
    </AppShell>
  );
}
