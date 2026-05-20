export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  userId: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  createdAtUtc: string;
  createdByUserId: string;
}

export interface AdminUser {
  id: string;
  email: string;
  isAdminApproved: boolean;
  roles: string[];
  directPermissions: string[];
}

export interface Role {
  name: string;
  permissions: string[];
}
