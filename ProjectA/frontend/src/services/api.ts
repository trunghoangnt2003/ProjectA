const apiUrl = import.meta.env.VITE_API_URL ?? "https://localhost:7114";

interface ApiFunction {
  <T>(path: string, options?: RequestInit): Promise<T>;
  get: <T = any>(path: string, config?: any) => Promise<{ data: T }>;
  post: <T = any>(path: string, body?: any, config?: any) => Promise<{ data: T }>;
  put: <T = any>(path: string, body?: any, config?: any) => Promise<{ data: T }>;
  delete: <T = any>(path: string, config?: any) => Promise<{ data: T }>;
}

const apiFn = async function <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (path.startsWith("/") && !path.startsWith("/api/")) {
    path = `/api${path}`;
  } else if (!path.startsWith("/") && !path.startsWith("api/")) {
    path = `/api/${path}`;
  }

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

  if (response.status === 403) {
    window.dispatchEvent(new Event("auth:403"));
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
};

function buildUrl(path: string, params?: any) {
  if (!params) return path;
  const qs = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      qs.append(key, params[key].toString());
    }
  }
  const str = qs.toString();
  return str ? `${path}?${str}` : path;
}

const apiGet = async <T = any>(path: string, config?: any) => {
  const url = buildUrl(path, config?.params);
  const data = await apiFn<T>(url, { method: "GET", ...config });
  return { data };
};

const apiPost = async <T = any>(path: string, body?: any, config?: any) => {
  const url = buildUrl(path, config?.params);
  const data = await apiFn<T>(url, { method: "POST", body: JSON.stringify(body), ...config });
  return { data };
};

const apiPut = async <T = any>(path: string, body?: any, config?: any) => {
  const url = buildUrl(path, config?.params);
  const data = await apiFn<T>(url, { method: "PUT", body: JSON.stringify(body), ...config });
  return { data };
};

const apiDelete = async <T = any>(path: string, config?: any) => {
  const url = buildUrl(path, config?.params);
  const data = await apiFn<T>(url, { method: "DELETE", ...config });
  return { data };
};

export const api = Object.assign(apiFn, {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
}) as ApiFunction;
