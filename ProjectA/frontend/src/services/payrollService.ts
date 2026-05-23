import { api } from "./api";

export interface PayrollRow {
  id: string;
  name: string;
  position: string;
  worked: number;
  absent: number;
  onTime: number;
  shiftRate: number;
  salary: number;
}

export const payrollService = {
  getPayroll: async (month: string): Promise<PayrollRow[]> => {
    const res = await api.get("/payrolls", { params: { month } });
    return res.data;
  },
};
