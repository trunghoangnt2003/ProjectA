const apiUrl = import.meta.env.VITE_API_URL ?? "https://localhost:7114";

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const text = await response.text();
      if (!text.trim()) {
        throw new Error(response.statusText);
      }

      const payload = JSON.parse(text) as {
        message?: string;
        reasons?: string[];
      };
      const reasons = payload.reasons?.length
        ? `\n${payload.reasons.join("\n")}`
        : "";
      const message = `${payload.message ?? response.statusText}${reasons}`;
      throw new Error(message);
    }

    const text = await response.text();
    const message = text.length > 0 ? text : response.statusText;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return null as T;
  }

  return JSON.parse(bodyText) as T;
}
