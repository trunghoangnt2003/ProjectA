import { useState } from "react";
import type { AdminUser, Product, Role } from "../types";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { ProductSection } from "../components/products/ProductSection";
import { RoleSection } from "../components/roles/RoleSection";
import { UserSection } from "../components/users/UserSection";

type TabKey = "products" | "users" | "roles";

interface DashboardPageProps {
  error: string | null;
  products: Product[];
  roles: Role[];
  users: AdminUser[];
  onLogout: () => void;
  onReloadProducts: () => Promise<void>;
  onReloadRoles: () => Promise<void>;
  onReloadUsers: () => Promise<void>;
  onClearError: () => void;
  onError: (err: unknown) => void;
}

export function DashboardPage({
  error,
  products,
  roles,
  users,
  onLogout,
  onReloadProducts,
  onReloadRoles,
  onReloadUsers,
  onClearError,
  onError
}: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const setTab = (tab: TabKey) => {
    onClearError();
    setActiveTab(tab);
  };

  const activeTitle =
    activeTab === "products"
      ? "Products"
      : activeTab === "users"
        ? "Users"
        : "Roles";

  return (
    <div className="min-vh-100 bg-light">
      <div className="d-flex">
        <aside
          className="bg-white border-end"
          style={{ width: 260, minHeight: "100vh" }}
        >
          <div className="p-3 border-bottom fw-semibold">ProjectA Admin</div>
          <div className="nav flex-column nav-pills p-3 gap-2">
            <button
              className={`nav-link text-start ${
                activeTab === "products" ? "active" : "text-dark"
              }`}
              onClick={() => setTab("products")}
            >
              Products
            </button>
            <button
              className={`nav-link text-start ${
                activeTab === "users" ? "active" : "text-dark"
              }`}
              onClick={() => setTab("users")}
            >
              Users
            </button>
            <button
              className={`nav-link text-start ${
                activeTab === "roles" ? "active" : "text-dark"
              }`}
              onClick={() => setTab("roles")}
            >
              Roles
            </button>
          </div>
        </aside>

        <main className="flex-grow-1">
          <div className="bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center px-4 py-3">
              <div>
                <div className="text-muted small">Admin Dashboard</div>
                <h4 className="mb-0">{activeTitle}</h4>
              </div>
              <button className="btn btn-outline-secondary" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="p-4">
            <ErrorAlert message={error} />

            {activeTab === "products" && (
              <ProductSection
                products={products}
                onReload={onReloadProducts}
                onClearError={onClearError}
                onError={onError}
              />
            )}

            {activeTab === "users" && (
              <UserSection
                users={users}
                roles={roles}
                onReloadUsers={onReloadUsers}
                onClearError={onClearError}
                onError={onError}
              />
            )}

            {activeTab === "roles" && (
              <RoleSection
                roles={roles}
                onReloadRoles={onReloadRoles}
                onClearError={onClearError}
                onError={onError}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
