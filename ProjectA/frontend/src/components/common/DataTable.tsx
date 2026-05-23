import type { ReactNode } from "react";
import { Card, Center, Loader, Table, Pagination, Group, Text } from "@mantine/core";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading,
  emptyTitle,
  emptyDescription,
  page,
  totalPages,
  onPageChange,
  totalCount,
}: DataTableProps<T>) {
  return (
    <Card p={0}>
      {loading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
            <Table.Thead bg="var(--mantine-color-gray-0)">
              <Table.Tr>
                {columns.map((col) => (
                  <Table.Th
                    key={col.key}
                    w={col.width}
                    ta={col.align ?? "left"}
                  >
                    {col.header}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={rowKey(row)}>
                  {columns.map((col) => (
                    <Table.Td key={col.key} ta={col.align ?? "left"}>
                      {col.render(row)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {totalPages !== undefined && totalPages > 1 && onPageChange && (
        <Group justify="space-between" px="md" py="sm" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
          <Text size="sm" c="dimmed">
            {totalCount !== undefined ? `Tổng số: ${totalCount}` : ""}
          </Text>
          <Pagination
            value={page ?? 1}
            onChange={onPageChange}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}
    </Card>
  );
}
