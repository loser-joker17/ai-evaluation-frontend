import { api } from "@/api/client";
import type { Quota } from "@/api/types";

export const usersApi = {
  quota: () => api<Quota>("/api/users/me/quota"),
};