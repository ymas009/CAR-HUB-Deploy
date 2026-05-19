const TOKEN_KEY = "carhub_token";

export class ApiRequestError extends Error {
  code?: string;
  details?: Record<string, string>;

  constructor(message: string, code?: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.details = details;
  }
}

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
    let code: string | undefined;
    let details: Record<string, string> | undefined;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string; code?: string; details?: Record<string, string> };
      message = parsed.message ?? parsed.error ?? parsed.code ?? message;
      code = parsed.code;
      details = parsed.details;
    } catch {
      message = text;
    }
    throw new ApiRequestError(message || `API request failed: ${response.status}`, code, details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1",
  get<T>(path: string): Promise<T> {
    return request<T>("GET", path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>("POST", path, body);
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>("PUT", path, body);
  },
  async blob(path: string): Promise<Blob> {
    const token = tokenStore.get();
    const response = await fetch(`${api.baseUrl}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const text = await response.text();
      let message = `Download failed: ${response.status}`;
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string; code?: string };
        message = parsed.message ?? parsed.error ?? parsed.code ?? message;
      } catch {
        message = text || message;
      }
      throw new Error(message);
    }
    return response.blob();
  }
};
