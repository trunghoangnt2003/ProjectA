/** Định dạng dùng chung — locale vi-VN. */

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}
