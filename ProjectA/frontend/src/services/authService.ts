import type { AuthResponse } from "../types";
import { mockDelay } from "./mock/mockClient";

/**
 * MOCK login (FE làm trước, chưa cần BE).
 * Khi có API thật, thay thân hàm bằng:
 *   return api<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
 * (import { api } from "./api")
 */

// Tài khoản demo — mật khẩu chung: 123456
const MOCK_ACCOUNTS = [
  { id: "u1", email: "admin@projecta.local", password: "123456" },
  { id: "u2", email: "letan1@projecta.local", password: "123456" },
  { id: "u3", email: "phucvu1@projecta.local", password: "123456" },
];

export async function login(email: string, password: string): Promise<AuthResponse> {
  const account = MOCK_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
  );

  if (!account) {
    await mockDelay(null);
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  return mockDelay({
    token: `mock-token-${account.id}`,
    expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: account.id,
    email: account.email,
  });
}
