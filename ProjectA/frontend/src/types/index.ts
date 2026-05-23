export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  userId: string;
  email: string;
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

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDesc?: boolean;
  search?: string;
}
