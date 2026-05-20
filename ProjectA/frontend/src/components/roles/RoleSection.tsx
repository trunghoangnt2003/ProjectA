import { useMemo, useState } from "react";
import type { Role } from "../../types";
import {
  addRolePermission,
  createRole,
  removeRolePermission
} from "../../services/adminService";
import { permissionOptions } from "../../constants/permissionOptions";

interface RoleSectionProps {
  roles: Role[];
  onReloadRoles: () => Promise<void>;
  onClearError: () => void;
  onError: (err: unknown) => void;
}

export function RoleSection({
  roles,
  onReloadRoles,
  onClearError,
  onError
}: RoleSectionProps) {
  const [newRoleName, setNewRoleName] = useState("");
  const [rolePermissionInput, setRolePermissionInput] = useState<
    Record<string, string>
  >({});
  const permissionOptionsMemo = useMemo(() => permissionOptions, []);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      return;
    }

    onClearError();
    try {
      await createRole(newRoleName);
      setNewRoleName("");
      await onReloadRoles();
    } catch (err) {
      onError(err);
    }
  };

  const handleAddPermission = async (roleName: string) => {
    const permission = rolePermissionInput[roleName];
    if (!permission) {
      return;
    }

    onClearError();
    try {
      await addRolePermission(roleName, permission);
      setRolePermissionInput((prev) => ({ ...prev, [roleName]: "" }));
      await onReloadRoles();
    } catch (err) {
      onError(err);
    }
  };

  const handleRemovePermission = async (roleName: string, permission: string) => {
    onClearError();
    try {
      await removeRolePermission(roleName, permission);
      await onReloadRoles();
    } catch (err) {
      onError(err);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Create Role</h5>
            <div className="input-group">
              <input
                className="form-control"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="Role name"
              />
              <button className="btn btn-primary" onClick={handleCreateRole}>
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Roles</h5>
            <div className="vstack gap-3">
              {roles.map((role) => (
                <div key={role.name} className="border rounded p-3">
                  <div className="fw-semibold">{role.name}</div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={`${role.name}-${permission}`}
                        className="badge bg-success"
                      >
                        {permission}
                        <button
                          className="btn btn-sm btn-link text-white ms-2 p-0"
                          onClick={() =>
                            handleRemovePermission(role.name, permission)
                          }
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {role.permissions.length === 0 && (
                      <span className="text-muted">No permissions</span>
                    )}
                  </div>
                  <div className="input-group input-group-sm mt-2">
                    <select
                      className="form-select"
                      value={rolePermissionInput[role.name] ?? ""}
                      onChange={(event) =>
                        setRolePermissionInput((prev) => ({
                          ...prev,
                          [role.name]: event.target.value
                        }))
                      }
                    >
                      <option value="">Select permission</option>
                      {permissionOptionsMemo.map((permission) => (
                        <option key={permission} value={permission}>
                          {permission}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleAddPermission(role.name)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
              {roles.length === 0 && (
                <div className="text-muted">No roles</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
