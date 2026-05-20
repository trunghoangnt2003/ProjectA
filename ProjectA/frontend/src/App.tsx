import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import type { AdminUser, Product, Role } from "./types";
import { login } from "./services/authService";
import { getProducts } from "./services/productService";
import { getRoles, getUsers } from "./services/adminService";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  const { token, setToken, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const clearError = () => setError(null);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Unexpected error");
    }

    if (!localStorage.getItem("token")) {
      setToken(null);
    }
  };

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const loadRoles = async () => {
    const data = await getRoles();
    setRoles(data);
  };

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const refreshAll = async () => {
    await Promise.all([loadProducts(), loadRoles(), loadUsers()]);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    refreshAll().catch(handleError);
  }, [token]);

  const handleLogin = async (email: string, password: string) => {
    clearError();

    try {
      const response = await login(email, password);
      setToken(response.token);
    } catch (err) {
      handleError(err);
    }
  };

  const handleLogout = () => {
    logout();
    setProducts([]);
    setRoles([]);
    setUsers([]);
  };

  if (!token) {
    return <LoginPage error={error} onLogin={handleLogin} />;
  }

  return (
    <DashboardPage
      error={error}
      products={products}
      roles={roles}
      users={users}
      onLogout={handleLogout}
      onReloadProducts={loadProducts}
      onReloadRoles={loadRoles}
      onReloadUsers={loadUsers}
      onClearError={clearError}
      onError={handleError}
    />
  );
}
