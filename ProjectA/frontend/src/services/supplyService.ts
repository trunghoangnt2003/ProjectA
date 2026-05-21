import type { Supply } from "../types/domain";
import { createMockService } from "./mock/mockClient";

// Vật tư bán (forSale + salePrice): cầu, cước... bán cho khách qua POS.
// Vật tư sân (forSale=false): lưới, vợt/giày cho thuê — phục vụ sân, không bán.
const seed: Supply[] = [
  { id: "s1", name: "Cầu lông Yonex AS-30", category: "Cầu", quantity: 24, unit: "ống", reorderLevel: 10, forSale: true, salePrice: 320000 },
  { id: "s2", name: "Cầu lông Lining A+62", category: "Cầu", quantity: 6, unit: "ống", reorderLevel: 10, forSale: true, salePrice: 260000 },
  { id: "s3", name: "Cước đan vợt Yonex BG-65", category: "Cước", quantity: 30, unit: "cuộn", reorderLevel: 8, forSale: true, salePrice: 120000 },
  { id: "s4", name: "Vợt cho thuê Yonex", category: "Vợt", quantity: 15, unit: "cây", reorderLevel: 5, forSale: false, rentalPrice: 30000, rentalValue: 400000 },
  { id: "s5", name: "Lưới sân thi đấu", category: "Lưới", quantity: 4, unit: "cái", reorderLevel: 2, forSale: false },
  { id: "s6", name: "Cuốn cán vợt", category: "Phụ kiện", quantity: 80, unit: "cái", reorderLevel: 20, forSale: true, salePrice: 25000 },
  { id: "s7", name: "Giày cầu lông cho thuê", category: "Giày", quantity: 3, unit: "đôi", reorderLevel: 5, forSale: false, rentalPrice: 25000, rentalValue: 300000 },
];

export const supplyService = createMockService(seed);
