import type { Combo } from "../types/domain";
import { createMockService } from "./mock/mockClient";

// Combo tham chiếu mặt hàng theo id của productService / supplyService.
const seed: Combo[] = [
  {
    id: "cb1",
    name: "Combo Giải nhiệt",
    description: "2 nước suối + 1 nước ngọt cho cặp đôi sau trận.",
    lines: [
      { refId: "p1", source: "product", name: "Nước suối Aquafina 500ml", quantity: 2 },
      { refId: "p3", source: "product", name: "Coca-Cola lon", quantity: 1 },
    ],
    price: 30000, // ưu đãi so với 35.000 lẻ
    active: true,
  },
  {
    id: "cb2",
    name: "Combo Tập luyện",
    description: "1 ống cầu + 1 nước tăng lực.",
    lines: [
      { refId: "s1", source: "supply", name: "Cầu lông Yonex AS-30", quantity: 1 },
      { refId: "p2", source: "product", name: "Pocari Sweat", quantity: 1 },
    ],
    price: 330000,
    active: true,
  },
];

export const comboService = createMockService(seed);
