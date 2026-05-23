import { useCallback, useEffect, useState } from "react";
import type { PagedResult, QueryOptions } from "../types";
import { notify, toMessage } from "../lib/notify";

export interface PagedService<T> {
  getAll: (opts?: QueryOptions) => Promise<PagedResult<T>>;
  create?: (input: any) => Promise<T>;
  update?: (id: string, input: any) => Promise<T>;
  delete?: (id: string) => Promise<void>;
  [key: string]: any;
}

export function usePagedResource<T extends { id: string }>(
  service: PagedService<T>,
  initialOpts: QueryOptions = {},
  labels: { created?: string; updated?: string; removed?: string } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [opts, setOpts] = useState<QueryOptions>({ page: 1, pageSize: 10, ...initialOpts });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getAll(opts);
      setData(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      notify.error(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service, opts]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setPage = useCallback((page: number) => setOpts((p) => ({ ...p, page })), []);
  const setPageSize = useCallback((pageSize: number) => setOpts((p) => ({ ...p, page: 1, pageSize })), []);
  const setSearch = useCallback((search: string) => setOpts((p) => ({ ...p, page: 1, search })), []);
  const setDateRange = useCallback((startDate?: string, endDate?: string) => setOpts((p) => ({ ...p, page: 1, startDate, endDate })), []);

  const create = async (input: any) => {
    if (!service.create) return;
    await service.create(input);
    notify.success(labels.created ?? "Đã thêm mới.");
    await reload();
  };

  const update = async (id: string, input: any) => {
    if (!service.update) return;
    await service.update(id, input);
    notify.success(labels.updated ?? "Đã cập nhật.");
    await reload();
  };

  const remove = async (id: string) => {
    if (!service.delete) return;
    await service.delete(id);
    notify.success(labels.removed ?? "Đã xóa.");
    await reload();
  };

  return { data, totalCount, totalPages, opts, setPage, setPageSize, setSearch, setDateRange, loading, reload, create, update, remove };
}
