import { useMemo, useState } from "react";
import type { AdminUser, Role } from "../../types";
import {
  addUserPermission,
  addUserRole,
  approveUser,
  createUser,
  removeUserPermission,
  removeUserRole,
  revokeUserApproval
} from "../../services/adminService";
import { permissionOptions } from "../../constants/permissionOptions";

interface UserSectionProps {
  users: AdminUser[];
  roles: Role[];
  onReloadUsers: () => Promise<void>;
  onClearError: () => void;
  onError: (err: unknown) => void;
}

export function UserSection({
  users,
  roles,
  onReloadUsers,
  onClearError,
  onError
}: UserSectionProps) {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserApproved, setNewUserApproved] = useState(false);

  const [userRoleInput, setUserRoleInput] = useState<Record<string, string>>(
    {}
  );
  const [userPermissionInput, setUserPermissionInput] = useState<
    Record<string, string>
  >({});

  const permissionOptionsMemo = useMemo(() => permissionOptions, []);

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      return;
    }

    onClearError();
    try {
      await createUser({
        email: newUserEmail,
        password: newUserPassword,
        isAdminApproved: newUserApproved
      });
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserApproved(false);
      await onReloadUsers();
    } catch (err) {
      onError(err);
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    onClearError();
    try {
      if (approved) {
        await approveUser(userId);
      } else {
        await revokeUserApproval(userId);
      }
      await onReloadUsers();
    } catch (err) {
      onError(err);
    }
  };

  const handleAddRole = async (userId: string) => {
    const roleName = userRoleInput[userId];
    if (!roleName) {
      return;
    }

    onClearError();
    try {
      await addUserRole(userId, roleName);
      setUserRoleInput((prev) => ({ ...prev, [userId]: "" }));
      await onReloadUsers();
    } catch (err) {
      onError(err);
    }
  };

  const handleRemoveRole = async (userId: string, roleName: string) => {
    onClearError();
    try {
      await removeUserRole(userId, roleName);
      await onReloadUsers();
    } catch (err) {
      onError(err);
    }
  };

  const handleAddPermission = async (userId: string) => {
    const permission = userPermissionInput[userId];
    if (!permission) {
      return;
    }

    onClearError();
    try {
      await addUserPermission(userId, permission);
      setUserPermissionInput((prev) => ({ ...prev, [userId]: "" }));
      await onReloadUsers();
    } catch (err) {
      onError(err);
    }
  };

  const handleRemovePermission = async (
    userId: string,
    permission: string
  ) => {
    onClearError();
    try {
      await removeUserPermission(userId, permission);
      await onReloadUsers();
    } catch (err) {
      onError(err);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Create User</h5>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
              />
            </div>
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={newUserApproved}
                onChange={(event) => setNewUserApproved(event.target.checked)}
                id="approvedCheck"
              />
              <label className="form-check-label" htmlFor="approvedCheck">
                Admin approved
              </label>
            </div>
            <button
              className="btn btn-primary w-100"
              onClick={handleCreateUser}
            >
              Create
            </button>
          </div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Users</h5>
            <div className="vstack gap-3">
              {users.map((user) => (
                <div key={user.id} className="border rounded p-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-semibold">{user.email}</div>
                      <small className="text-muted">{user.id}</small>
                    </div>
                    <div>
                      {user.isAdminApproved ? (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleApproval(user.id, false)}
                        >
                          Revoke approval
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleApproval(user.id, true)}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold">Roles</div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {user.roles.map((role) => (
                        <span
                          key={`${user.id}-${role}`}
                          className="badge bg-secondary"
                        >
                          {role}
                          <button
                            className="btn btn-sm btn-link text-white ms-2 p-0"
                            onClick={() => handleRemoveRole(user.id, role)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-muted">No roles</span>
                      )}
                    </div>
                    <div className="input-group input-group-sm mt-2">
                      <select
                        className="form-select"
                        value={userRoleInput[user.id] ?? ""}
                        onChange={(event) =>
                          setUserRoleInput((prev) => ({
                            ...prev,
                            [user.id]: event.target.value
                          }))
                        }
                      >
                        <option value="">Select role</option>
                        {roles.map((role) => (
                          <option key={role.name} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleAddRole(user.id)}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold">Direct Permissions</div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {user.directPermissions.map((permission) => (
                        <span
                          key={`${user.id}-${permission}`}
                          className="badge bg-info text-dark"
                        >
                          {permission}
                          <button
                            className="btn btn-sm btn-link text-dark ms-2 p-0"
                            onClick={() =>
                              handleRemovePermission(user.id, permission)
                            }
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {user.directPermissions.length === 0 && (
                        <span className="text-muted">
                          No direct permissions
                        </span>
                      )}
                    </div>
                    <div className="input-group input-group-sm mt-2">
                      <select
                        className="form-select"
                        value={userPermissionInput[user.id] ?? ""}
                        onChange={(event) =>
                          setUserPermissionInput((prev) => ({
                            ...prev,
                            [user.id]: event.target.value
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
                        onClick={() => handleAddPermission(user.id)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="text-muted">No users</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
