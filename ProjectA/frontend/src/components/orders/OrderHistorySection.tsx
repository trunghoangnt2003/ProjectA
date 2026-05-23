import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconSearch, IconReceipt, IconEye } from "@tabler/icons-react";
import { PageHeader, DataTable, StatCard } from "../common";
import type { DataTableColumn } from "../common";
import { orderService } from "../../services/orderService";
import type { Order } from "../../types/domain";
import { formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const todayIso = new Date().toISOString().slice(0, 10);

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemCount(o: Order): number {
  return o.lines.reduce((sum, l) => sum + l.quantity, 0);
}

import { usePagedResource } from "../../hooks/usePagedResource";

/** Lịch sử bán hàng (POS) — theo dõi các hóa đơn đã thanh toán. */
export function OrderHistorySection() {
  const { data: filtered, loading, page, totalPages, totalCount, setPage, setSearch, setDateRange } = usePagedResource(
    orderService,
    { startDate: todayIso, endDate: todayIso, sortBy: "date", sortDesc: true }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState(todayIso);
  const [detail, setDetail] = useState<Order | null>(null);

  useEffect(() => {
    setDateRange(date || undefined, date || undefined);
  }, [date]);

  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);

  const columns: DataTableColumn<Order>[] = [
    { key: "code", header: "Mã HĐ", render: (o) => <Text fw={600}>{o.code}</Text> },
    { key: "time", header: "Giờ", render: (o) => formatTime(o.createdAt) },
    { key: "customer", header: "Khách hàng", render: (o) => o.customerName ?? "Khách lẻ" },
    {
      key: "court",
      header: "Sân",
      render: (o) =>
        o.courtName ? o.courtName : <Text c="dimmed">—</Text>,
    },
    {
      key: "items",
      header: "SL món",
      align: "right",
      render: (o) => itemCount(o),
    },
    {
      key: "total",
      header: "Tổng tiền",
      align: "right",
      render: (o) => <Text fw={600}>{formatVnd(o.total)}</Text>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 60,
      render: (o) => (
        <Tooltip label="Xem chi tiết">
          <ActionIcon variant="subtle" onClick={() => setDetail(o)}>
            <IconEye size={18} />
          </ActionIcon>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Lịch sử bán hàng"
        subtitle="Theo dõi hóa đơn đã thanh toán qua màn Bán hàng"
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard
          label="Số hóa đơn"
          value={filtered.length}
          icon={<IconReceipt size={26} />}
          color="brand"
        />
        <StatCard
          label="Doanh thu (lọc)"
          value={formatVnd(totalRevenue)}
          icon={<IconReceipt size={26} />}
          color="grape"
        />
        <StatCard
          label="SL món đã bán"
          value={filtered.reduce((s, o) => s + itemCount(o), 0)}
          icon={<IconReceipt size={26} />}
          color="teal"
        />
      </SimpleGrid>

      <Card mb="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Tìm kiếm"
            placeholder="Mã HĐ, khách hoặc sân…"
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchQuery);
            }}
            onBlur={() => setSearch(searchQuery)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <TextInput
            label="Ngày"
            type="date"
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
        </Group>
      </Card>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(o) => o.id}
        loading={loading}
        emptyTitle="Chưa có hóa đơn nào"
        emptyDescription="Hóa đơn tạo ở màn Bán hàng sẽ xuất hiện tại đây."
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      <Modal
        opened={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Hóa đơn ${detail.code}` : ""}
        centered
      >
        {detail && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {new Date(detail.createdAt).toLocaleString("vi-VN")}
              </Text>
              <Badge variant="light">{itemCount(detail)} món</Badge>
            </Group>
            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  Khách hàng
                </Text>
                <Text size="sm" fw={500}>
                  {detail.customerName ?? "Khách lẻ"}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Sân
                </Text>
                <Text size="sm" fw={500}>
                  {detail.courtName ?? "—"}
                </Text>
              </div>
            </Group>

            <Table verticalSpacing="xs" withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mặt hàng</Table.Th>
                  <Table.Th ta="right">Đơn giá</Table.Th>
                  <Table.Th ta="center">SL</Table.Th>
                  <Table.Th ta="right">Thành tiền</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {detail.lines.map((l, i) => (
                  <Table.Tr key={`${l.source}:${l.refId}:${i}`}>
                    <Table.Td>{l.name}</Table.Td>
                    <Table.Td ta="right">{formatVnd(l.unitPrice)}</Table.Td>
                    <Table.Td ta="center">{l.quantity}</Table.Td>
                    <Table.Td ta="right">{formatVnd(l.unitPrice * l.quantity)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Group justify="space-between">
              <Text fw={600}>Tổng cộng</Text>
              <Text fw={700} size="lg" c="brand">
                {formatVnd(detail.total)}
              </Text>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
