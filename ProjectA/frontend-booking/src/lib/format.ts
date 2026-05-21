export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function formatDateVi(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
