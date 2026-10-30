import { api } from "@/api/client";
import type { Quota } from "@/api/types";
import type { Progress } from "@/api/types";

export const usersApi = {
  quota: () => api<Quota>("/api/users/me/quota"),
  progress: (last: number) => api<Progress>(`/api/users/me/progress?last=${last}`),
};