import { createContext, useContext, type ReactNode } from "react";

interface PermissionContextValue {
  permissions: string[];
  /** true nếu không yêu cầu quyền, hoặc user có quyền đó. */
  can: (permission?: string) => boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  can: () => false,
});

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  const can = (permission?: string) =>
    !permission || permissions.includes(permission);
  return (
    <PermissionContext.Provider value={{ permissions, can }}>
      {children}
    </PermissionContext.Provider>
  );
}

/** Đọc quyền hiệu lực của user hiện tại để gate menu/màn hình. */
export function usePermissions() {
  return useContext(PermissionContext);
}
