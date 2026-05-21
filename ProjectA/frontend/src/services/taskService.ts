import type { StaffTask } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const now = new Date().toISOString();

const seed: StaffTask[] = [
  { id: "t1", title: "Lau sàn Sân 1–3", category: "Vệ sinh sân", assignee: "Vũ Đình Khoa", status: "done", createdAt: now },
  { id: "t2", title: "Căng lưới Sân 4", category: "Setup sân", assignee: "Đặng Văn Mạnh", status: "in-progress", createdAt: now },
  { id: "t3", title: "Kiểm tra đèn Sân VIP", category: "Setup sân", status: "pending", createdAt: now },
  { id: "t4", title: "Bổ sung nước vào tủ mát", category: "Khác", assignee: "Bùi Thị Lan", status: "pending", createdAt: now },
];

export const taskService = createMockService(seed);
