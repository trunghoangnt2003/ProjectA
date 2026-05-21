/**
 * Hạ tầng MOCK cho giai đoạn làm FE trước (chưa có BE).
 *
 * Mỗi module domain dùng `createMockService(seed)` để có CRUD chạy trên mảng in-memory,
 * giả lập độ trễ mạng. Khi BE sẵn sàng: thay thân hàm bằng gọi `api()` thật, giữ NGUYÊN
 * chữ ký (list/create/update/remove) là các section không phải sửa.
 */

const DELAY_MS = 350;

export function mockDelay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), DELAY_MS));
}

export interface MockService<T extends { id: string }> {
  list: () => Promise<T[]>;
  create: (input: Omit<T, "id">) => Promise<T>;
  update: (id: string, input: Omit<T, "id">) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function createMockService<T extends { id: string }>(
  seed: T[]
): MockService<T> {
  let items = [...seed];

  return {
    list: () => mockDelay([...items]),
    create: (input) => {
      const created = { ...input, id: newId() } as T;
      items = [created, ...items];
      return mockDelay(created);
    },
    update: (id, input) => {
      const updated = { ...input, id } as T;
      items = items.map((item) => (item.id === id ? updated : item));
      return mockDelay(updated);
    },
    remove: (id) => {
      items = items.filter((item) => item.id !== id);
      return mockDelay(undefined);
    },
  };
}
