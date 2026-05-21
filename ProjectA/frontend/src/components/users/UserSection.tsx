import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Pill,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { PageHeader, EmptyState } from "../common";
import type { AdminUser, Role } from "../../types";
import {
  addUserPermission,
  addUserRole,
  approveUser,
  createUser,
  getRoles,
  getUsers,
  removeUserPermission,
  removeUserRole,
  revokeUserApproval,
} from "../../services/mock/adminMock";
import { permissionOptions, permissionLabel } from "../../constants/permissionOptions";
import { notify, toMessage } from "../../lib/notify";

export function UserSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const form = useForm({
    initialValues: { email: "", password: "", isAdminApproved: false },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Email không hợp lệ"),
      password: (v) => (v.length >= 6 ? null : "Tối thiểu 6 ký tự"),
    },
  });

  const run = async (action: () => Promise<unknown>, ok: string) => {
    try {
      await action();
      await reload();
      notify.success(ok);
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  const handleCreate = form.onSubmit(async (values) => {
    setSaving(true);
    try {
      await createUser(values);
      await reload();
      notify.success("Đã tạo người dùng.");
      form.reset();
      close();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  return (
    <>
      <PageHeader
        title="Người dùng"
        subtitle="Quản lý tài khoản, vai trò và quyền trực tiếp"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Thêm người dùng
          </Button>
        }
      />

      {users.length === 0 ? (
        <Card>
          <EmptyState title="Chưa có người dùng" />
        </Card>
      ) : (
        <Stack>
          {users.map((user) => (
            <Card key={user.id}>
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={600}>{user.email}</Text>
                  <Text size="xs" c="dimmed">
                    {user.id}
                  </Text>
                </div>
                <Group gap="sm">
                  <Badge color={user.isAdminApproved ? "teal" : "gray"} variant="light">
                    {user.isAdminApproved ? "Đã duyệt" : "Chờ duyệt"}
                  </Badge>
                  <Switch
                    checked={user.isAdminApproved}
                    onChange={(e) =>
                      run(
                        () =>
                          e.currentTarget.checked
                            ? approveUser(user.id)
                            : revokeUserApproval(user.id),
                        "Đã cập nhật phê duyệt."
                      )
                    }
                    label="Duyệt"
                  />
                </Group>
              </Group>

              <Text size="sm" fw={600} mt="md" mb={6}>
                Vai trò
              </Text>
              <Group gap="xs">
                {user.roles.length === 0 && (
                  <Text size="sm" c="dimmed">
                    Chưa có vai trò
                  </Text>
                )}
                {user.roles.map((role) => (
                  <Pill
                    key={role}
                    withRemoveButton
                    onRemove={() =>
                      run(() => removeUserRole(user.id, role), "Đã gỡ vai trò.")
                    }
                  >
                    {role}
                  </Pill>
                ))}
              </Group>
              <Select
                mt="xs"
                placeholder="Thêm vai trò..."
                data={roles.map((r) => r.name).filter((r) => !user.roles.includes(r))}
                value={null}
                onChange={(val) =>
                  val && run(() => addUserRole(user.id, val), "Đã thêm vai trò.")
                }
                maw={260}
              />

              <Text size="sm" fw={600} mt="md" mb={6}>
                Quyền trực tiếp
              </Text>
              <Group gap="xs">
                {user.directPermissions.length === 0 && (
                  <Text size="sm" c="dimmed">
                    Không có quyền trực tiếp
                  </Text>
                )}
                {user.directPermissions.map((perm) => (
                  <Pill
                    key={perm}
                    withRemoveButton
                    onRemove={() =>
                      run(
                        () => removeUserPermission(user.id, perm),
                        "Đã gỡ quyền."
                      )
                    }
                  >
                    {permissionLabel(perm)}
                  </Pill>
                ))}
              </Group>
              <Select
                mt="xs"
                placeholder="Thêm quyền..."
                searchable
                data={permissionOptions
                  .filter((p) => !user.directPermissions.includes(p))
                  .map((p) => ({ value: p, label: permissionLabel(p) }))}
                value={null}
                onChange={(val) =>
                  val && run(() => addUserPermission(user.id, val), "Đã thêm quyền.")
                }
                maw={260}
              />
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title="Thêm người dùng" centered>
        <form onSubmit={handleCreate}>
          <Stack>
            <TextInput label="Email" required {...form.getInputProps("email")} />
            <PasswordInput label="Mật khẩu" required {...form.getInputProps("password")} />
            <Switch
              label="Phê duyệt ngay"
              {...form.getInputProps("isAdminApproved", { type: "checkbox" })}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" loading={saving}>
                Tạo
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
