import { useState } from "react";
import { Alert, Badge, Button, Card, Group, Stack, Switch, Text } from "@mantine/core";
import {
  IconPrinter,
  IconScan,
  IconCash,
  IconQrcode,
  IconToolsKitchen2,
  IconInfoCircle,
} from "@tabler/icons-react";
import { notify } from "../../lib/notify";

interface Device {
  key: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
}

const INITIAL: Device[] = [
  { key: "receipt", name: "Máy in hóa đơn", icon: <IconPrinter size={22} />, connected: true },
  { key: "barcode", name: "Máy quét mã vạch", icon: <IconScan size={22} />, connected: true },
  { key: "drawer", name: "Ngăn kéo tiền", icon: <IconCash size={22} />, connected: true },
  { key: "qr", name: "Máy quét QR", icon: <IconQrcode size={22} />, connected: false },
  { key: "kitchen", name: "Máy in bếp/quầy nước", icon: <IconToolsKitchen2 size={22} />, connected: false },
];

export function DeviceSettings() {
  const [devices, setDevices] = useState<Device[]>(INITIAL);

  const toggle = (key: string) =>
    setDevices((prev) => prev.map((d) => (d.key === key ? { ...d, connected: !d.connected } : d)));

  return (
    <Stack maw={640}>
      <Text fw={700} size="xl">Thiết bị POS</Text>
      <Alert icon={<IconInfoCircle size={18} />} color="blue">
        Phần cứng là <b>mô phỏng</b> ở bản FE. Khi tích hợp thật sẽ kết nối qua WebUSB / cầu in cục bộ.
      </Alert>

      <Stack gap="sm">
        {devices.map((d) => (
          <Card key={d.key} withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="md" wrap="nowrap">
                {d.icon}
                <div>
                  <Text fw={500}>{d.name}</Text>
                  <Badge size="xs" variant="light" color={d.connected ? "teal" : "gray"}>
                    {d.connected ? "Đã kết nối" : "Chưa kết nối"}
                  </Badge>
                </div>
              </Group>
              <Group gap="sm" wrap="nowrap">
                <Button
                  size="xs"
                  variant="light"
                  disabled={!d.connected}
                  onClick={() => notify.success(`Đã gửi lệnh kiểm tra tới ${d.name}.`)}
                >
                  Kiểm tra
                </Button>
                <Switch checked={d.connected} onChange={() => toggle(d.key)} />
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
