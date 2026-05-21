import { notifications } from "@mantine/notifications";

/**
 * Thông báo toast dùng chung. Luôn dùng các hàm này thay vì gọi
 * notifications.show() rải rác để giữ màu/icon/wording nhất quán.
 */
export const notify = {
  success(message: string, title = "Thành công") {
    notifications.show({ title, message, color: "teal" });
  },
  error(message: string, title = "Có lỗi xảy ra") {
    notifications.show({ title, message, color: "red" });
  },
  info(message: string, title?: string) {
    notifications.show({ title, message, color: "brand" });
  },
};

/** Trích message gọn từ lỗi bất kỳ (Error, string, unknown). */
export function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Đã có lỗi không xác định.";
}
