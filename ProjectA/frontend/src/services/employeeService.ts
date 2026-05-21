import type { Employee } from "../types/domain";
import { createMockService } from "./mock/mockClient";

const seed: Employee[] = [
  { id: "e1", name: "Hoàng Văn Phúc", position: "Quản lý", phone: "0901111222", shift: "S1", status: "active", joinedAt: "2023-06-01", shiftRate: 350000 },
  { id: "e2", name: "Ngô Thị Hà", position: "Lễ tân", phone: "0902222333", shift: "S1", status: "active", joinedAt: "2024-02-15", shiftRate: 220000 },
  { id: "e3", name: "Vũ Đình Khoa", position: "Phục vụ", phone: "0903333444", shift: "S2", status: "active", joinedAt: "2024-08-10", shiftRate: 200000 },
  { id: "e4", name: "Bùi Thị Lan", position: "Lễ tân", phone: "0904444555", shift: "S2", status: "active", joinedAt: "2025-01-20", shiftRate: 220000 },
  { id: "e5", name: "Đặng Văn Mạnh", position: "Kỹ thuật", phone: "0905555666", shift: "S3", status: "inactive", joinedAt: "2024-11-05", shiftRate: 250000 },
];

export const employeeService = createMockService(seed);
