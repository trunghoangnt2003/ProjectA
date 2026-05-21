import { FormEvent, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { IconFeather } from "@tabler/icons-react";
import { ErrorAlert } from "../components/common";

interface LoginPageProps {
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
}

/** Tài khoản demo (mock) — khớp MOCK_ACCOUNTS trong authService. Mật khẩu chung: 123456. */
const DEMO_ACCOUNTS = [
  { email: "admin@projecta.local", role: "Quản trị viên", note: "Toàn quyền + POS", color: "brand" },
  { email: "letan1@projecta.local", role: "Lễ tân", note: "Đặt sân, khách, POS", color: "blue" },
  { email: "phucvu1@projecta.local", role: "Phục vụ", note: "Bán hàng, hàng hóa", color: "grape" },
];
const DEMO_PASSWORD = "123456";

export function LoginPage({ error, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" bg="var(--mantine-color-gray-0)" p="md">
      <Stack w="100%" maw={420} gap="lg">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="md" variant="light" color="brand">
            <IconFeather size={32} />
          </ThemeIcon>
          <Title order={2}>Sân Cầu Lông</Title>
          <Text c="dimmed" size="sm">
            Đăng nhập để vào hệ thống quản lý
          </Text>
        </Stack>

        <Card shadow="md" padding="xl">
          <ErrorAlert message={error} />
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Email"
                type="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              <PasswordInput
                label="Mật khẩu"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button type="submit" fullWidth mt="xs" loading={loading}>
                Đăng nhập
              </Button>
            </Stack>
          </form>

          <Divider label="Tài khoản demo (mock)" labelPosition="center" mt="lg" mb="xs" />
          <Stack gap="xs">
            {DEMO_ACCOUNTS.map((acc) => (
              <UnstyledButton
                key={acc.email}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(DEMO_PASSWORD);
                }}
              >
                <Card withBorder padding="xs" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Text size="sm" fw={500}>{acc.email}</Text>
                      <Text size="xs" c="dimmed">{acc.note}</Text>
                    </div>
                    <Badge variant="light" color={acc.color}>{acc.role}</Badge>
                  </Group>
                </Card>
              </UnstyledButton>
            ))}
          </Stack>
          <Text size="xs" c="dimmed" ta="center" mt="xs">
            Mật khẩu chung: <b>{DEMO_PASSWORD}</b> · bấm một tài khoản để tự điền
          </Text>
        </Card>

        <Group justify="center">
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} Sân Cầu Lông Management
          </Text>
        </Group>
      </Stack>
    </Center>
  );
}
