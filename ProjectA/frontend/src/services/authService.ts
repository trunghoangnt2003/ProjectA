import type { AuthResponse } from "../types";
import { api } from "./api";

/**
 * Đăng nhập bằng email + mật khẩu → gọi API thật.
 * Tài khoản admin seed: admin@projecta.local / Admin@12345
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Lấy danh sách quyền của user hiện tại.
 */
export async function getMyPermissions(): Promise<string[]> {
  return api<string[]>("/api/auth/me/permissions");
}
