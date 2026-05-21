import { notifications } from "@mantine/notifications";

export const notify = {
  success: (message: string, title = "Thành công") =>
    notifications.show({ title, message, color: "teal" }),
  error: (message: string, title = "Có lỗi") =>
    notifications.show({ title, message, color: "red" }),
};
