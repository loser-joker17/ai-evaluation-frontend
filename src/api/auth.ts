import { api } from "@/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/api/types";

export const authApi = {
  login: (body: LoginRequest) =>
    api<AuthResponse>("/api/auth/login", { method: "POST", body, auth: false }),

  register: (body: RegisterRequest) =>
    api<AuthResponse>("/api/auth/register", { method: "POST", body, auth: false }),

  // Revokes the refresh token and clears the cookie on the backend.
  logout: () => api<void>("/api/auth/logout", { method: "POST", auth: false }),

  me: () => api<User>("/api/users/me"),
};