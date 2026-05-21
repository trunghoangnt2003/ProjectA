import type { CustomerAccount } from "../types/domain";
import { mockDelay, newId } from "./mock/mockClient";

interface Account extends CustomerAccount {
  password: string;
}

// Tài khoản khách demo (mock). Đăng nhập bằng SĐT + mật khẩu.
let accounts: Account[] = [
  { id: "ca1", name: "Nguyễn Văn An", phone: "0901234567", email: "an@example.com", password: "123456", loyaltyPoints: 1250, membershipLevel: "gold", joinedAt: "2024-03-12" },
  { id: "ca2", name: "Trần Thị Bình", phone: "0912345678", password: "123456", loyaltyPoints: 320, membershipLevel: "silver", joinedAt: "2025-01-05" },
  { id: "ca3", name: "Khách Thường", phone: "0900000000", password: "123456", loyaltyPoints: 40, membershipLevel: "basic", joinedAt: "2025-05-01" },
];

const strip = (a: Account): CustomerAccount => {
  const { password, ...rest } = a;
  return rest;
};

export const customerAuthService = {
  login: (phone: string, password: string): Promise<CustomerAccount> => {
    const acc = accounts.find((a) => a.phone === phone.trim() && a.password === password);
    if (!acc) {
      return mockDelay(null).then(() => {
        throw new Error("Số điện thoại hoặc mật khẩu không đúng.");
      });
    }
    return mockDelay(strip(acc));
  },

  register: (input: { name: string; phone: string; email?: string; password: string }): Promise<CustomerAccount> => {
    if (accounts.some((a) => a.phone === input.phone.trim())) {
      return mockDelay(null).then(() => {
        throw new Error("Số điện thoại đã được đăng ký.");
      });
    }
    const acc: Account = {
      id: newId(),
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      password: input.password,
      loyaltyPoints: 0,
      membershipLevel: "basic",
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    accounts = [...accounts, acc];
    return mockDelay(strip(acc));
  },
};
