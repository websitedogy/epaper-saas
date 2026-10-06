const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const developmentApiBaseUrl = typeof window !== "undefined" && window.location.hostname.endsWith(".localhost")
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : "https://api.dogyepaper.com";

export const API_BASE_URL = configuredApiBaseUrl ?? developmentApiBaseUrl;
export const API_TOKEN_KEY = "dogy_api_token";

const GET_CACHE_TTL = 5_000;
const getCache = new Map<string, { expiresAt: number; value: unknown }>();
const getInFlight = new Map<string, Promise<unknown>>();

export function getApiToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(API_TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getApiToken();
  const method = (init.method ?? "GET").toUpperCase();
  const cacheKey = `${token ?? "anonymous"}:${method}:${path}`;

  if (method === "GET") {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = getInFlight.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData) && !(init.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (typeof window !== "undefined" && !headers.has("X-Tenant-Host")) {
    headers.set("X-Tenant-Host", window.location.hostname);
  }

  const request = fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  }).then(async (response) => {
    if (response.status === 401 || response.status === 403) {
      window.localStorage.removeItem(API_TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.message ?? "Request failed");
    }

    const value = (await response.json()) as T;
    if (method === "GET") getCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL, value });
    return value;
  });

  if (method === "GET") {
    getInFlight.set(cacheKey, request);
    void request.finally(() => getInFlight.delete(cacheKey)).catch(() => undefined);
  }

  return request;
}

export function logoutFromApi() {
  if (typeof window === "undefined") return Promise.resolve();
  const token = getApiToken();
  if (!token) {
    window.localStorage.removeItem(API_TOKEN_KEY);
    return Promise.resolve();
  }

  return fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Tenant-Host": window.location.hostname,
    },
  }).catch(() => undefined).finally(() => {
    window.localStorage.removeItem(API_TOKEN_KEY);
  });
}
