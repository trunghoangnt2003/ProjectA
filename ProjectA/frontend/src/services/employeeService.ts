import { api } from "./api";
import type { Employee } from "../types/domain";
import type { PagedResult, QueryOptions } from "./api";

export const employeeService = {
  getAll: async (options?: QueryOptions): Promise<PagedResult<Employee>> => {
    const res = await api.get("/employees", { params: options });
    return res.data;
  },

  getById: async (id: string): Promise<Employee> => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  create: async (data: Omit<Employee, "id">): Promise<Employee> => {
    const res = await api.post("/employees", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Employee>): Promise<void> => {
    await api.put(`/employees/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },
};
