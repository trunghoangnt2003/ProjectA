import { useCallback, useEffect, useState } from "react";
import type { MockService } from "../services/mock/mockClient";
import { notify, toMessage } from "../lib/notify";

/**
 * Hook CRUD dùng chung cho mọi section danh sách.
 * Tự load khi mount, expose create/update/remove kèm toast + reload.
 * Hoạt động với MockService giờ, và với service API thật sau này (cùng chữ ký).
 */
export function useCrudResource<T extends { id: string }>(
  service: MockService<T>,
  labels: { created?: string; updated?: string; removed?: string } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await service.list());
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (input: Omit<T, "id">) => {
    await service.create(input);
    notify.success(labels.created ?? "Đã thêm mới.");
    await reload();
  };

  const update = async (id: string, input: Omit<T, "id">) => {
    await service.update(id, input);
    notify.success(labels.updated ?? "Đã cập nhật.");
    await reload();
  };

  const remove = async (id: string) => {
    await service.remove(id);
    notify.success(labels.removed ?? "Đã xóa.");
    await reload();
  };

  return { data, loading, reload, create, update, remove };
}
