import type { Voucher } from "../types/domain";
import { mockDelay } from "./mock/mockClient";

// Mã khuyến mãi đang hiệu lực (mock — đồng bộ admin).
const vouchers: Voucher[] = [
  { code: "SUMMER10", label: "Giảm 10% mùa hè", type: "percentage", value: 10, minOrder: 200000 },
  { code: "GIAM50K", label: "Giảm 50.000₫", type: "fixed", value: 50000, minOrder: 300000 },
  { code: "HAPPY18", label: "Giảm 20% giờ vàng", type: "percentage", value: 20 },
];

export interface VoucherResult {
  ok: boolean;
  voucher?: Voucher;
  discount: number;
  message: string;
}

export const promotionService = {
  /** Kiểm tra & tính giảm giá cho mã voucher trên tổng tạm tính. */
  validate: (code: string, subtotal: number): Promise<VoucherResult> => {
    const v = vouchers.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    if (!v) {
      return mockDelay({ ok: false, discount: 0, message: "Mã không hợp lệ." });
    }
    if (v.minOrder && subtotal < v.minOrder) {
      return mockDelay({
        ok: false,
        discount: 0,
        message: `Cần đơn tối thiểu ${v.minOrder.toLocaleString("vi-VN")}₫.`,
      });
    }
    const discount =
      v.type === "percentage" ? Math.round((subtotal * v.value) / 100) : v.value;
    return mockDelay({ ok: true, voucher: v, discount, message: `Áp dụng "${v.label}".` });
  },

  list: () => mockDelay([...vouchers]),
};
