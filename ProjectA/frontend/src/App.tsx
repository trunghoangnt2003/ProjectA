import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { login, getMyPermissions } from "./services/authService";
import { PermissionProvider } from "./hooks/usePermissions";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PosApp } from "./pages/PosApp";
import { toMessage } from "./lib/notify";

function loadStoredPermissions(): string[] {
  try {
    return JSON.parse(localStorage.getItem("permissions") ?? "[]");
  } catch {
    return [];
  }
}

export default function App() {
  const { token, setToken, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(
    localStorage.getItem("email")
  );
  const [permissions, setPermissions] = useState<string[]>(loadStoredPermissions);

  const applyPermissions = (perms: string[]) => {
    setPermissions(perms);
    localStorage.setItem("permissions", JSON.stringify(perms));
  };

  const refreshPermissions = useCallback(async () => {
    if (!token) return;
    try {
      const perms = await getMyPermissions();
      applyPermissions(perms);
    } catch {
      // Bỏ qua lỗi nếu không lấy được (vd mạng đứt)
    }
  }, [token]);

  // Khôi phục quyền sau khi refresh nếu còn phiên nhưng chưa có quyền trong cache.
  useEffect(() => {
    if (token && permissions.length === 0) {
      refreshPermissions();
    }
  }, [token, permissions.length, refreshPermissions]);

  // Lắng nghe sự kiện auth:403 để cập nhật lại quyền nếu bị server chặn (thu hồi quyền)
  useEffect(() => {
    const handle403 = () => refreshPermissions();
    window.addEventListener("auth:403", handle403);
    return () => window.removeEventListener("auth:403", handle403);
  }, [refreshPermissions]);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await login(email, password);
      setToken(response.token);
      localStorage.setItem("email", response.email);
      localStorage.setItem("userId", response.userId);
      setUserEmail(response.email);
      
      // Chờ một chút để token được set vào local storage trước khi gọi api lấy quyền
      setTimeout(async () => {
        try {
          applyPermissions(await getMyPermissions());
        } catch {}
      }, 0);
    } catch (err) {
      setError(toMessage(err));
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("permissions");
    setUserEmail(null);
    setPermissions([]);
  };

  if (!token) {
    return <LoginPage error={error} onLogin={handleLogin} />;
  }

  return (
    <PermissionProvider permissions={permissions}>
      <AuthedApp userEmail={userEmail ?? undefined} onLogout={handleLogout} />
    </PermissionProvider>
  );
}

/** Chọn giao diện theo URL: /pos/* → chế độ POS, còn lại → admin. */
function AuthedApp({ userEmail, onLogout }: { userEmail?: string; onLogout: () => void }) {
  const location = useLocation();
  if (location.pathname.startsWith("/pos")) {
    return <PosApp userEmail={userEmail} />;
  }
  return <DashboardPage userEmail={userEmail} onLogout={onLogout} />;
}
