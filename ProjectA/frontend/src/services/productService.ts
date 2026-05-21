import type { Product } from "../types/domain";
import { createMockService } from "./mock/mockClient";

// Hàng hóa bán cho khách: đồ uống + đồ ăn. (Trước đây là module "Thức uống".)
const seed: Product[] = [
  { id: "p1", name: "Nước suối Aquafina 500ml", category: "Nước suối", price: 10000, stock: 120 },
  { id: "p2", name: "Pocari Sweat", category: "Tăng lực", price: 18000, stock: 45 },
  { id: "p3", name: "Coca-Cola lon", category: "Nước ngọt", price: 15000, stock: 8 },
  { id: "p4", name: "Revive chanh muối", category: "Tăng lực", price: 12000, stock: 60 },
  { id: "p5", name: "Bia Tiger lon", category: "Bia", price: 22000, stock: 0 },
  { id: "p6", name: "Trà C2 đào", category: "Nước ngọt", price: 12000, stock: 30 },
  { id: "p7", name: "Mì ly Hảo Hảo", category: "Đồ ăn", price: 15000, stock: 40 },
  { id: "p8", name: "Bánh mì trứng", category: "Đồ ăn", price: 20000, stock: 12 },
];

export const productService = createMockService(seed);

/** Ngưỡng tồn kho thấp để cảnh báo. */
export const PRODUCT_LOW_STOCK = 10;
