import type { CreateSubmissionRequest } from "@/api/types";

// Unsent answer, per user, in this browser only. Storage can be blocked or full,
// so every call is wrapped: a failed save must never break typing.
const PREFIX = "draft:";

export function loadDraft(userId: string): CreateSubmissionRequest | null {
  try {
    const raw = localStorage.getItem(PREFIX + userId);
    return raw ? (JSON.parse(raw) as CreateSubmissionRequest) : null;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draft: CreateSubmissionRequest) {
  try {
    localStorage.setItem(PREFIX + userId, JSON.stringify(draft));
  } catch {
    // storage full or blocked: ignore
  }
}

export function clearDraft(userId: string) {
  try {
    localStorage.removeItem(PREFIX + userId);
  } catch {
    // ignore
  }
}

/** On logout: remove every user's draft from this browser (shared computers). */
export function clearAllDrafts() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}