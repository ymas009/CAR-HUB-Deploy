const TOKEN_KEY = "carhub_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${api.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string; code?: string };
      message = parsed.message ?? parsed.error ?? parsed.code ?? message;
    } catch {
      message = text;
    }
    throw new Error(message || `API request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  get<T>(path: string): Promise<T> {
    return request<T>("GET", path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>("POST", path, body);
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>("PUT", path, body);
  }
};
