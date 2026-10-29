import { api } from "@/api/client";
import type { Page, SubmissionSummary } from "@/api/types";

export const submissionsApi = {
  list: (page: number, size = 20) =>
    api<Page<SubmissionSummary>>(`/api/submissions?page=${page}&size=${size}`),
};