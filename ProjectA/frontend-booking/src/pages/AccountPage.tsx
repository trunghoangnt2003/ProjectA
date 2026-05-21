import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  List,
  PasswordInput,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck, IconCrown, IconLogout, IconUser } from "@tabler/icons-react";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { membershipService } from "../services/membershipService";
import type { MembershipPlan } from "../types/domain";
import { notify } from "../lib/notify";
import { formatDateVi } from "../lib/format";

export function AccountPage() {
  const { customer, login, register, logout } = useCustomerAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    membershipService.list().then(setPlans);
  }, []);

  const loginForm = useForm({
    initialValues: { phone: "", password: "" },
    validate: { phone: (v) => (/^\d{9,11}$/.test(v) ? null : "SĐT không hợp lệ") },
  });
  const regForm = useForm({
    initialValues: { name: "", phone: "", email: "", password: "" },
    validate: {
      name: (v) => (v.trim() ? null : "Nhập họ tên"),
      phone: (v) => (/^\d{9,11}$/.test(v) ? null : "SĐT không hợp lệ"),
      password: (v) => (v.length >= 6 ? null : "Tối thiểu 6 ký tự"),
    },
  });

  const doLogin = loginForm.onSubmit(async (v) => {
    setBusy(true);
    try {
      await login(v.phone, v.password);
      notify.success("Đăng nhập thành công.");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Lỗi đăng nhập.");
    } finally {
      setBusy(false);
    }
  });

  const doRegister = regForm.onSubmit(async (v) => {
    setBusy(true);
    try {
      await register(v);
      notify.success("Đăng ký thành công.");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Lỗi đăng ký.");
    } finally {
      setBusy(false);
    }
  });

  if (customer) {
    const plan = plans.find((p) => p.level === customer.membershipLevel);
    return (
      <Container size="sm" py="lg">
        <Card withBorder shadow="sm">
          <Group justify="space-between">
            <Group>
              <ThemeIcon size={48} radius="xl" variant="light" color="brand"><IconUser size={26} /></ThemeIcon>
              <div>
                <Title order={4}>{customer.name}</Title>
                <Text size="sm" c="dimmed">{customer.phone}{customer.email ? ` · ${customer.email}` : ""}</Text>
              </div>
            </Group>
            <Button variant="light" color="gray" leftSection={<IconLogout size={16} />} onClick={logout}>
              Đăng xuất
            </Button>
          </Group>

          <Divider my="md" />
          <Group grow>
            <Stat label="Điểm tích lũy" value={customer.loyaltyPoints.toLocaleString("vi-VN")} />
            <Stat label="Hạng thành viên" value={plan?.name ?? customer.membershipLevel} />
            <Stat label="Tham gia" value={formatDateVi(customer.joinedAt)} />
          </Group>

          {plan && (
            <Card withBorder mt="md" bg="var(--mantine-color-gray-0)">
              <Group gap="xs" mb="xs">
                <IconCrown size={18} color="var(--mantine-color-yellow-6)" />
                <Text fw={600}>{plan.name}</Text>
                {plan.discountPercent > 0 && <Badge color="teal" variant="light">Giảm {plan.discountPercent}%</Badge>}
              </Group>
              <List spacing={4} size="sm" icon={<ThemeIcon size={16} radius="xl" color="teal"><IconCheck size={11} /></ThemeIcon>}>
                {plan.benefits.map((b, i) => <List.Item key={i}>{b}</List.Item>)}
              </List>
            </Card>
          )}

          <Text size="xs" c="dimmed" mt="md">
            Ưu đãi hạng thành viên sẽ tự áp dụng khi bạn đặt sân.
          </Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xs" py="lg">
      <Card withBorder shadow="sm">
        <Tabs defaultValue="login">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="login">Đăng nhập</Tabs.Tab>
            <Tabs.Tab value="register">Đăng ký</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login">
            <form onSubmit={doLogin}>
              <Stack>
                <TextInput label="Số điện thoại" placeholder="0901234567" {...loginForm.getInputProps("phone")} />
                <PasswordInput label="Mật khẩu" {...loginForm.getInputProps("password")} />
                <Button type="submit" color="accent" loading={busy}>Đăng nhập</Button>
                <Text size="xs" c="dimmed" ta="center">Demo: 0901234567 / 123456 (hạng Vàng)</Text>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="register">
            <form onSubmit={doRegister}>
              <Stack>
                <TextInput label="Họ tên" {...regForm.getInputProps("name")} />
                <TextInput label="Số điện thoại" {...regForm.getInputProps("phone")} />
                <TextInput label="Email (tùy chọn)" {...regForm.getInputProps("email")} />
                <PasswordInput label="Mật khẩu" {...regForm.getInputProps("password")} />
                <Button type="submit" color="accent" loading={busy}>Tạo tài khoản</Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text fw={600}>{value}</Text>
    </div>
  );
}
