import type { StockMovement } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const atDay = (ago: number, h: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

// Lịch sử nhập/xuất mẫu (số tồn ban đầu trong product/supplyService đã phản ánh các giao dịch này).
const seed: StockMovement[] = [
  { id: "m1", createdAt: atDay(3, 9), itemSource: "product", itemId: "p1", itemName: "Nước suối Aquafina 500ml", type: "in", quantity: 100, balanceAfter: 120, reason: "Nhập nhà cung cấp" },
  { id: "m2", createdAt: atDay(2, 14), itemSource: "supply", itemId: "s1", itemName: "Cầu lông Yonex AS-30", type: "in", quantity: 20, balanceAfter: 24, reason: "Nhập kho định kỳ" },
  { id: "m3", createdAt: atDay(1, 18), itemSource: "product", itemId: "p3", itemName: "Coca-Cola lon", type: "out", quantity: 12, balanceAfter: 8, reason: "Bán lẻ trong ngày" },
  { id: "m4", createdAt: atDay(1, 20), itemSource: "supply", itemId: "s5", itemName: "Lưới sân thi đấu", type: "out", quantity: 1, balanceAfter: 4, reason: "Thay lưới Sân 4" },
];

export const stockMovementService = createMockService(seed);
