import type { CashierShift } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const atDay = (ago: number, h: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const seed: CashierShift[] = [
  { id: "cs1", cashier: "Ngô Thị Hà", openedAt: atDay(1, 8), closedAt: atDay(1, 17), openingCash: 1000000, countedCash: 3850000, status: "closed", note: "Khớp quỹ." },
];

export const cashierShiftService = createMockService(seed);
