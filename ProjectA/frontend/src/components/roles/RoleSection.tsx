import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  Modal,
  Pill,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { PageHeader, EmptyState } from "../common";
import type { Role } from "../../types";
import {
  addRolePermission,
  createRole,
  getRoles,
  removeRolePermission,
} from "../../services/mock/adminMock";
import { permissionOptions, permissionLabel } from "../../constants/permissionOptions";
import { notify, toMessage } from "../../lib/notify";

export function RoleSection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    try {
      setRoles(await getRoles());
    } catch (err) {
      notify.error(toMessage(err));
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const form = useForm({
    initialValues: { name: "" },
    validate: { name: (v) => (v.trim() ? null : "Nhập tên vai trò") },
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
      await createRole(values.name.trim());
      await reload();
      notify.success("Đã tạo vai trò.");
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
        title="Phân quyền"
        subtitle="Quản lý vai trò và quyền tương ứng"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Thêm vai trò
          </Button>
        }
      />

      {roles.length === 0 ? (
        <Card>
          <EmptyState title="Chưa có vai trò" />
        </Card>
      ) : (
        <Stack>
          {roles.map((role) => (
            <Card key={role.name}>
              <Text fw={600}>{role.name}</Text>
              <Group gap="xs" mt="sm">
                {role.permissions.length === 0 && (
                  <Text size="sm" c="dimmed">
                    Chưa có quyền
                  </Text>
                )}
                {role.permissions.map((perm) => (
                  <Pill
                    key={perm}
                    withRemoveButton
                    onRemove={() =>
                      run(
                        () => removeRolePermission(role.name, perm),
                        "Đã gỡ quyền."
                      )
                    }
                  >
                    {permissionLabel(perm)}
                  </Pill>
                ))}
              </Group>
              <Select
                mt="sm"
                placeholder="Thêm quyền..."
                searchable
                data={permissionOptions
                  .filter((p) => !role.permissions.includes(p))
                  .map((p) => ({ value: p, label: permissionLabel(p) }))}
                value={null}
                onChange={(val) =>
                  val &&
                  run(() => addRolePermission(role.name, val), "Đã thêm quyền.")
                }
                maw={260}
              />
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title="Thêm vai trò" centered>
        <form onSubmit={handleCreate}>
          <Stack>
            <TextInput label="Tên vai trò" required {...form.getInputProps("name")} />
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
