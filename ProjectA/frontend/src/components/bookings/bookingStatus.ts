import type { BookingStatus } from "../../types/domain";

export interface StatusMeta {
  label: string;
  color: string;
}

/** Nhãn + màu cho từng trạng thái booking — dùng chung mọi màn hình. */
export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  pending: { label: "Chờ xác nhận", color: "yellow" },
  confirmed: { label: "Đã xác nhận", color: "blue" },
  playing: { label: "Đang chơi", color: "green" },
  completed: { label: "Hoàn thành", color: "teal" },
  cancelled: { label: "Đã hủy", color: "red" },
  "no-show": { label: "Không đến", color: "gray" },
};

/** Trạng thái chiếm chỗ trên lịch (hiển thị ô màu). Hủy & không đến bị loại. */
export const OCCUPYING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "playing",
  "completed",
];
