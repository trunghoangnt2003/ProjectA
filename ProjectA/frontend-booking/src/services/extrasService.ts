import type { ExtraItem } from "../types/domain";
import { mockDelay } from "./mock/mockClient";

// Dịch vụ/hàng hóa khách có thể đặt kèm khi book sân (mock — đồng bộ admin).
const extras: ExtraItem[] = [
  { id: "p1", name: "Nước suối Aquafina 500ml", group: "Đồ uống", price: 10000 },
  { id: "p2", name: "Pocari Sweat", group: "Đồ uống", price: 18000 },
  { id: "p3", name: "Coca-Cola lon", group: "Đồ uống", price: 15000 },
  { id: "p7", name: "Mì ly Hảo Hảo", group: "Đồ ăn", price: 15000 },
  { id: "p8", name: "Bánh mì trứng", group: "Đồ ăn", price: 20000 },
  { id: "cb1", name: "Combo Giải nhiệt (2 nước + 1 ngọt)", group: "Combo", price: 30000 },
  { id: "cb2", name: "Combo Tập luyện (cầu + tăng lực)", group: "Combo", price: 330000 },
  { id: "s1", name: "Cầu lông Yonex AS-30 (ống)", group: "Combo", price: 320000 },
  { id: "r-vot", name: "Thuê vợt", group: "Thuê đồ", price: 30000, unit: "cây/lượt" },
  { id: "r-giay", name: "Thuê giày", group: "Thuê đồ", price: 25000, unit: "đôi/lượt" },
];

export const extrasService = {
  list: () => mockDelay([...extras]),
};
