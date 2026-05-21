import type { ReactNode } from "react";
import { Card, Center, Loader, Table } from "@mantine/core";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  /** Định danh cột, duy nhất trong bảng. */
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
}

/**
 * Bảng dữ liệu chuẩn: header + rows + trạng thái loading/empty.
 * Dùng cho mọi danh sách (sân, đặt sân, nhân viên, vật tư...).
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading,
  emptyTitle,
  emptyDescription,
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
    </Card>
  );
}
