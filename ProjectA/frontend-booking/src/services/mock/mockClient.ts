const DELAY_MS = 250;

export function mockDelay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), DELAY_MS));
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
