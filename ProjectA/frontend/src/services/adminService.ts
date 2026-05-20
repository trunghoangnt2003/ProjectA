import { api } from "./api";
import type { AdminUser, Role } from "../types";

export interface CreateUserPayload {
  email: string;
  password: string;
  isAdminApproved: boolean;
}

export function getUsers() {
  return api<AdminUser[]>("/api/admin/users");
}

export function createUser(payload: CreateUserPayload) {
  return api<AdminUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function approveUser(userId: string) {
  return api<void>(`/api/admin/users/${userId}/approve`, { method: "POST" });
}

export function revokeUserApproval(userId: string) {
  return api<void>(`/api/admin/users/${userId}/revoke-approval`, {
    method: "POST"
  });
}

export function addUserRole(userId: string, roleName: string) {
  return api<void>(
    `/api/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    { method: "POST" }
  );
}

export function removeUserRole(userId: string, roleName: string) {
  return api<void>(
    `/api/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    { method: "DELETE" }
  );
}

export function addUserPermission(userId: string, permission: string) {
  return api<void>(
    `/api/admin/users/${userId}/permissions/${encodeURIComponent(permission)}`,
    { method: "POST" }
  );
}

export function removeUserPermission(userId: string, permission: string) {
  return api<void>(
    `/api/admin/users/${userId}/permissions/${encodeURIComponent(permission)}`,
    { method: "DELETE" }
  );
}

export function getRoles() {
  return api<Role[]>("/api/admin/roles");
}

export function createRole(roleName: string) {
  return api<void>(`/api/admin/roles/${encodeURIComponent(roleName)}`, {
    method: "POST"
  });
}

export function addRolePermission(roleName: string, permission: string) {
  return api<void>(
    `/api/admin/roles/${encodeURIComponent(
      roleName
    )}/permissions/${encodeURIComponent(permission)}`,
    { method: "POST" }
  );
}

export function removeRolePermission(roleName: string, permission: string) {
  return api<void>(
    `/api/admin/roles/${encodeURIComponent(
      roleName
    )}/permissions/${encodeURIComponent(permission)}`,
    { method: "DELETE" }
  );
}
