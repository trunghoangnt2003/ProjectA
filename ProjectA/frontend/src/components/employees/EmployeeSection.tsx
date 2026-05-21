import { useState } from "react";
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil } from "@tabler/icons-react";
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { useCrudResource } from "../../hooks/useCrudResource";
import { employeeService } from "../../services/employeeService";
import type { Employee } from "../../types/domain";
import { SHIFT_OPTIONS, shiftLabel } from "../../constants/shifts";
import { formatDate, formatVnd } from "../../lib/format";
import { toMessage, notify } from "../../lib/notify";

const POSITIONS = ["Quản lý", "Lễ tân", "Phục vụ", "Kỹ thuật"];

type EmployeeForm = Omit<Employee, "id">;

const emptyForm: EmployeeForm = {
  name: "",
  position: "Lễ tân",
  phone: "",
  shift: "S1",
  status: "active",
  joinedAt: new Date().toISOString().slice(0, 10),
  shiftRate: 200000,
};

export function EmployeeSection() {
  const { data, loading, create, update, remove } = useCrudResource(
    employeeService,
    { created: "Đã thêm nhân viên.", updated: "Đã cập nhật.", removed: "Đã xóa nhân viên." }
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<EmployeeForm>({
    initialValues: emptyForm,
    validate: {
      name: (v) => (v.trim() ? null : "Nhập tên nhân viên"),
      phone: (v) => (/^\d{9,11}$/.test(v) ? null : "Số điện thoại không hợp lệ"),
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.setValues(emptyForm);
    open();
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
    form.setValues({ ...e });
    open();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setSaving(true);
    try {
      if (editingId) await update(editingId, values);
      else await create(values);
      close();
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setSaving(false);
    }
  });

  const columns: DataTableColumn<Employee>[] = [
    { key: "name", header: "Nhân viên", render: (e) => <Text fw={500}>{e.name}</Text> },
    { key: "position", header: "Vị trí", render: (e) => e.position },
    { key: "phone", header: "Điện thoại", render: (e) => e.phone },
    {
      key: "shift",
      header: "Ca làm",
      render: (e) => (
        <Badge variant="light" color="blue">
          {shiftLabel(e.shift)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (e) =>
        e.status === "active" ? (
          <Badge variant="light" color="teal">
            Đang làm
          </Badge>
        ) : (
          <Badge variant="light" color="gray">
            Nghỉ
          </Badge>
        ),
    },
    { key: "rate", header: "Lương/ca", align: "right", render: (e) => formatVnd(e.shiftRate) },
    { key: "joined", header: "Vào làm", render: (e) => formatDate(e.joinedAt) },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      render: (e) => (
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Sửa">
            <ActionIcon variant="subtle" onClick={() => openEdit(e)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <ConfirmDeleteButton itemLabel={e.name} onConfirm={() => remove(e.id)} />
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Nhân viên"
        subtitle="Quản lý nhân viên và ca làm việc (RBAC theo ca)"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Thêm nhân viên
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        rowKey={(e) => e.id}
        loading={loading}
        emptyTitle="Chưa có nhân viên nào"
      />

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? "Sửa nhân viên" : "Thêm nhân viên"}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Họ tên" required {...form.getInputProps("name")} />
            <Select label="Vị trí" data={POSITIONS} {...form.getInputProps("position")} />
            <TextInput label="Số điện thoại" required {...form.getInputProps("phone")} />
            <Select
              label="Ca làm việc"
              description="Nhân viên chỉ thao tác được trong khung giờ ca của mình."
              data={SHIFT_OPTIONS}
              {...form.getInputProps("shift")}
            />
            <NumberInput
              label="Lương mỗi ca (₫)"
              min={0}
              step={10000}
              thousandSeparator="."
              decimalSeparator=","
              {...form.getInputProps("shiftRate")}
            />
            <Select
              label="Trạng thái"
              data={[
                { value: "active", label: "Đang làm" },
                { value: "inactive", label: "Nghỉ" },
              ]}
              {...form.getInputProps("status")}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" loading={saving}>
                {editingId ? "Lưu" : "Thêm"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
