import type { AdminUser, Role } from "../../types";
import { mockDelay } from "./mockClient";
import { permissionOptions } from "../../constants/permissionOptions";

/**
 * Mock cho phần Quản trị (Người dùng + Phân quyền).
 * Cùng chữ ký với `services/adminService.ts` thật → khi có BE chỉ cần đổi import.
 */

let roles: Role[] = [
  // Admin: toàn quyền — luôn bám theo danh sách quyền hiện có.
  { name: "Admin", permissions: [...permissionOptions] },
  {
    name: "QuanLy",
    permissions: [
      "court.view", "court.manage",
      "booking.view", "booking.manage",
      "customer.view", "customer.manage",
      "product.view", "product.manage",
      "supply.view", "supply.manage",
      "combo.manage", "inventory.manage", "rental.manage",
      "sale.use", "order.view",
      "payment.view", "payment.manage",
      "report.view",
      "promotion.manage", "membership.manage", "notification.manage",
      "employee.manage", "roster.manage", "attendance.manage", "payroll.view",
      "pos.use", "pos.cashier",
    ],
  },
  // Lễ tân (Receptionist): đặt sân + check-in + POS cơ bản.
  { name: "LeTan", permissions: ["booking.view", "booking.manage", "customer.view", "pos.use"] },
  // Phục vụ: bán hàng tại quầy.
  { name: "PhucVu", permissions: ["sale.use", "product.view", "customer.view", "pos.use"] },
  // Thu ngân (Cashier): POS + ca thu ngân + thanh toán.
  { name: "ThuNgan", permissions: ["pos.use", "pos.cashier", "sale.use", "order.view", "payment.view", "payment.manage", "customer.view", "booking.view"] },
];

let users: AdminUser[] = [
  { id: "u1", email: "admin@projecta.local", isAdminApproved: true, roles: ["Admin"], directPermissions: [] },
  { id: "u2", email: "letan1@projecta.local", isAdminApproved: true, roles: ["LeTan"], directPermissions: [] },
  { id: "u3", email: "phucvu1@projecta.local", isAdminApproved: true, roles: ["PhucVu"], directPermissions: ["customer.view"] },
  { id: "u4", email: "newstaff@projecta.local", isAdminApproved: false, roles: [], directPermissions: [] },
];

const uniq = (arr: string[]) => Array.from(new Set(arr));

/**
 * Quyền hiệu lực của một user = quyền từ các role + quyền gán trực tiếp.
 * Dùng cho FE gating menu/màn hình. (BE thật sẽ trả về trong token/claims.)
 */
export const getEffectivePermissions = (userId: string): Promise<string[]> => {
  const user = users.find((u) => u.id === userId);
  if (!user) return mockDelay<string[]>([]);
  const rolePerms = user.roles.flatMap(
    (rn) => roles.find((r) => r.name === rn)?.permissions ?? []
  );
  return mockDelay(uniq([...rolePerms, ...user.directPermissions]));
};

export interface CreateUserPayload {
  email: string;
  password: string;
  isAdminApproved: boolean;
}

export const getUsers = () => mockDelay([...users]);

export const createUser = (payload: CreateUserPayload) => {
  const user: AdminUser = {
    id: crypto.randomUUID(),
    email: payload.email,
    isAdminApproved: payload.isAdminApproved,
    roles: [],
    directPermissions: [],
  };
  users = [user, ...users];
  return mockDelay(user);
};

const setApproval = (userId: string, approved: boolean) => {
  users = users.map((u) => (u.id === userId ? { ...u, isAdminApproved: approved } : u));
  return mockDelay(undefined);
};
export const approveUser = (userId: string) => setApproval(userId, true);
export const revokeUserApproval = (userId: string) => setApproval(userId, false);

export const addUserRole = (userId: string, roleName: string) => {
  users = users.map((u) =>
    u.id === userId ? { ...u, roles: uniq([...u.roles, roleName]) } : u
  );
  return mockDelay(undefined);
};
export const removeUserRole = (userId: string, roleName: string) => {
  users = users.map((u) =>
    u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== roleName) } : u
  );
  return mockDelay(undefined);
};

export const addUserPermission = (userId: string, permission: string) => {
  users = users.map((u) =>
    u.id === userId
      ? { ...u, directPermissions: uniq([...u.directPermissions, permission]) }
      : u
  );
  return mockDelay(undefined);
};
export const removeUserPermission = (userId: string, permission: string) => {
  users = users.map((u) =>
    u.id === userId
      ? { ...u, directPermissions: u.directPermissions.filter((p) => p !== permission) }
      : u
  );
  return mockDelay(undefined);
};

export const getRoles = () => mockDelay([...roles]);

export const createRole = (roleName: string) => {
  if (!roles.some((r) => r.name === roleName)) {
    roles = [...roles, { name: roleName, permissions: [] }];
  }
  return mockDelay(undefined);
};

export const addRolePermission = (roleName: string, permission: string) => {
  roles = roles.map((r) =>
    r.name === roleName ? { ...r, permissions: uniq([...r.permissions, permission]) } : r
  );
  return mockDelay(undefined);
};
export const removeRolePermission = (roleName: string, permission: string) => {
  roles = roles.map((r) =>
    r.name === roleName
      ? { ...r, permissions: r.permissions.filter((p) => p !== permission) }
      : r
  );
  return mockDelay(undefined);
};
