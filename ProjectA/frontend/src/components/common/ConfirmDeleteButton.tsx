import { useState } from "react";
import { ActionIcon, Button, Group, Modal, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";

interface ConfirmDeleteButtonProps {
  /** Tên đối tượng để hiện trong câu xác nhận, vd "sân A1". */
  itemLabel?: string;
  title?: string;
  message?: string;
  /** Trả về Promise để nút hiện loading tới khi xong. */
  onConfirm: () => void | Promise<void>;
  /** true: nút icon nhỏ (trong bảng). false: nút có chữ. */
  iconOnly?: boolean;
}

/**
 * Nút xóa kèm modal xác nhận. Dùng cho mọi hành động xóa để tránh xóa nhầm.
 */
export function ConfirmDeleteButton({
  itemLabel,
  title = "Xác nhận xóa",
  message,
  onConfirm,
  iconOnly = true,
}: ConfirmDeleteButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      close();
    } finally {
      setLoading(false);
    }
  };

  const body =
    message ??
    `Bạn có chắc muốn xóa ${itemLabel ?? "mục này"}? Hành động không thể hoàn tác.`;

  return (
    <>
      {iconOnly ? (
        <Tooltip label="Xóa">
          <ActionIcon variant="subtle" color="red" onClick={open}>
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Button
          variant="light"
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={open}
        >
          Xóa
        </Button>
      )}

      <Modal opened={opened} onClose={close} title={title} centered>
        <Text size="sm">{body}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={close} disabled={loading}>
            Hủy
          </Button>
          <Button color="red" loading={loading} onClick={handleConfirm}>
            Xóa
          </Button>
        </Group>
      </Modal>
    </>
  );
}
