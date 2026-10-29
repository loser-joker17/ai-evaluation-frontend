// Mirrors the backend DTOs. Dates arrive as ISO strings.

export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: FieldError[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "ADMIN";
  emailVerified: boolean;
  researchConsent: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export type Paper = "GS1" | "GS2" | "GS3" | "GS4";

export type EvaluationStatus = "PENDING" | "QUEUED" | "RUNNING" | "COMPLETED" | "REJECTED" | "FAILED";

/** One row of GET /api/submissions. */
export interface SubmissionSummary {
  id: string;
  paper: Paper;
  maxMarks: number;
  wordLimit: number;
  wordCount: number | null;
  questionPreview: string;
  status: string;                                 // submission status (SUBMITTED, DRAFT...)
  evaluationStatus: EvaluationStatus | null;      // latest attempt; null if none
  totalScore: number | null;                      // only when COMPLETED
  evaluatedAt: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Quota {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  resetsAt: string;
}

export const IN_PROGRESS: EvaluationStatus[] = ["PENDING", "QUEUED", "RUNNING"];

/** The latest attempt, as included in GET /api/submissions/{id}. */
export interface EvaluationSummary {
  id: string;
  attemptNo: number;
  status: EvaluationStatus;
  totalScore: number | null;
  maxMarks: number;
  errorCode: "EVALUATOR_FAILED" | "TIMEOUT" | "CONTRACT" | "LOST" | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface Submission {
  id: string;
  sourceType: string;
  status: string;
  paper: Paper;
  maxMarks: number;
  wordLimit: number;
  wordCount: number | null;
  questionText: string;
  answerText: string | null;
  createdAt: string;
  submittedAt: string | null;
  evaluation: EvaluationSummary | null;
}

export interface CreateSubmissionRequest {
  paper: Paper;
  maxMarks: number;
  questionText: string;
  answerText: string;
}