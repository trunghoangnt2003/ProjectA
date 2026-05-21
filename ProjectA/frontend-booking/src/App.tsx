import { useState } from "react";
import { Box, Button, Container, Group, Menu, ThemeIcon, Title, UnstyledButton, Avatar, Text } from "@mantine/core";
import { IconFeather, IconUser, IconCalendarStar, IconBell, IconLogout, IconChevronDown } from "@tabler/icons-react";
import { HomePage } from "./pages/HomePage";
import { BookingPage } from "./pages/BookingPage";
import { LookupPage } from "./pages/LookupPage";
import { AccountPage } from "./pages/AccountPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { useCustomerAuth } from "./hooks/useCustomerAuth";

type View = "home" | "booking" | "lookup" | "account" | "mybookings" | "notifications";

export default function App() {
  const [view, setView] = useState<View>("home");
  const { customer, logout } = useCustomerAuth();

  return (
    <Box bg="var(--mantine-color-gray-0)" mih="100vh">
      <Box
        bg="white"
        style={{
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "var(--mantine-shadow-xs)",
        }}
      >
        <Container size="xl" py="sm">
          <Group justify="space-between" wrap="nowrap">
            <Group gap={8} style={{ cursor: "pointer" }} onClick={() => setView("home")}>
              <ThemeIcon size={36} radius="md" variant="gradient"
                gradient={{ from: "brand.7", to: "brand.4", deg: 135 }}>
                <IconFeather size={22} />
              </ThemeIcon>
              <Title order={4} fw={800} visibleFrom="xs">Sân Cầu Lông ProjectA</Title>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Button variant={view === "home" ? "light" : "subtle"} color="brand" onClick={() => setView("home")} visibleFrom="sm">
                Giới thiệu
              </Button>
              <Button variant={view === "lookup" ? "light" : "subtle"} color="brand" onClick={() => setView("lookup")} visibleFrom="sm">
                Tra cứu
              </Button>
              <Button color="accent" variant={view === "booking" ? "filled" : "light"} onClick={() => setView("booking")}>
                Đặt sân
              </Button>

              {customer ? (
                <Menu position="bottom-end" width={210} withArrow>
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap={6} wrap="nowrap">
                        <Avatar color="brand" radius="xl" size={32}>{customer.name.charAt(0).toUpperCase()}</Avatar>
                        <Text size="sm" fw={500} visibleFrom="sm" maw={120} truncate>{customer.name}</Text>
                        <IconChevronDown size={15} />
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconUser size={16} />} onClick={() => setView("account")}>Hồ sơ của tôi</Menu.Item>
                    <Menu.Item leftSection={<IconCalendarStar size={16} />} onClick={() => setView("mybookings")}>Lượt đặt của tôi</Menu.Item>
                    <Menu.Item leftSection={<IconBell size={16} />} onClick={() => setView("notifications")}>Thông báo</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>Đăng xuất</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <Button variant="subtle" color="brand" leftSection={<IconUser size={16} />} onClick={() => setView("account")}>
                  Đăng nhập
                </Button>
              )}
            </Group>
          </Group>
        </Container>
      </Box>

      {view === "home" && <HomePage onBook={() => setView("booking")} />}
      {view === "booking" && <BookingPage />}
      {view === "lookup" && <LookupPage />}
      {view === "account" && <AccountPage />}
      {view === "mybookings" && <MyBookingsPage onGoAccount={() => setView("account")} />}
      {view === "notifications" && <NotificationsPage />}
    </Box>
  );
}
