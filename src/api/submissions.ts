import { api } from "@/api/client";
import type { CreateSubmissionRequest, Page, Submission, SubmissionSummary } from "@/api/types";

export const submissionsApi = {
  list: (page: number, size = 20) =>
    api<Page<SubmissionSummary>>(`/api/submissions?page=${page}&size=${size}`),

  create: (body: CreateSubmissionRequest) =>
    api<Submission>("/api/submissions", { method: "POST", body }),

  retry: (id: string) => api<Submission>(`/api/submissions/${id}/retry`, { method: "POST" }),

  remove: (id: string) => api<void>(`/api/submissions/${id}`, { method: "DELETE" }),

  get: (id: string) => api<Submission>(`/api/submissions/${id}`),
};