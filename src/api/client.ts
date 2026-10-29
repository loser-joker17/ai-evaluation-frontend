import { useAuthStore } from "@/auth/authStore";
import type { AuthResponse, ErrorResponse, FieldError } from "@/api/types";

/** Every failed request becomes one of these; forms show `message` and `fieldErrors`. */
export class ApiError extends Error {
  readonly status: number;            // 0 = network error (server unreachable)
  readonly fieldErrors: FieldError[];

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;   // false for login/register/logout: no token, no refresh-and-retry
}

const NETWORK_ERROR = "Can't reach the server. Check your internet connection and try again.";

/** Calls the backend. Paths start with /api; Vite (dev) or the proxy (prod) forwards them. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth ?? true;
  let response = await send(path, options, useAuth);

  if (response.status === 401 && useAuth) {
    // Access token expired (15 min): refresh once, then repeat the request.
    const refreshed = await refreshSession();
    if (!refreshed) {
      throw new ApiError(401, "Your session has expired. Please log in again.");
    }
    response = await send(path, options, useAuth);
  }
  return handle<T>(response);
}

async function send(path: string, options: RequestOptions, useAuth: boolean): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = useAuthStore.getState().accessToken;
  if (useAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    return await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",   // sends the httpOnly refresh cookie to /api/auth/*
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  let body: Partial<ErrorResponse> = {};
  try {
    body = (await response.json()) as Partial<ErrorResponse>;
  } catch {
    // not JSON (e.g. a proxy error page): use the generic message
  }
  throw new ApiError(
    response.status,
    body.message ?? "Something went wrong. Please try again.",
    body.fieldErrors ?? [],
  );
}

// ------------------------------------------------------------------ refresh

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Gets a new access token from the refresh cookie. Returns false if the session is over.
 * One refresh at a time: within this tab (shared promise) and across tabs (Web Lock),
 * because reusing an old refresh token makes the backend log the user out everywhere.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = withRefreshLock(doRefresh).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" });
  } catch {
    // Flaky internet is not a logout: keep the session state, report the network error.
    throw new ApiError(0, NETWORK_ERROR);
  }
  if (!response.ok) {
    useAuthStore.getState().clear();
    return false;
  }
  useAuthStore.getState().setSession((await response.json()) as AuthResponse);
  return true;
}

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  // Web Locks exist in all current browsers on https and localhost.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("auth-refresh", task) as Promise<T>;
  }
  return task();
}