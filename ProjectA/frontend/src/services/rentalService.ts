import type { Rental } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const today = new Date();
const atDay = (ago: number, h: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};
const isoDate = (ago: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - ago);
  return d.toISOString().slice(0, 10);
};

// Thuê vợt/giày — itemId khớp vật tư cho thuê trong supplyService (s4 vợt, s7 giày).
const seed: Rental[] = [
  {
    id: "r1", code: "TH-5001", itemId: "s4", itemName: "Vợt cho thuê Yonex",
    customerName: "Trần Thị Bình", customerPhone: "0912345678", quantity: 2, fee: 60000, deposit: 400000,
    borrowedAt: atDay(0, 17), dueAt: isoDate(0), status: "borrowed",
  },
  {
    id: "r2", code: "TH-5002", itemId: "s7", itemName: "Giày cầu lông cho thuê",
    customerName: "Lê Hoàng Cường", customerPhone: "0923456789", quantity: 1, fee: 25000, deposit: 150000,
    borrowedAt: atDay(1, 19), returnedAt: atDay(1, 21), status: "returned",
  },
];

export const rentalService = createMockService(seed);
