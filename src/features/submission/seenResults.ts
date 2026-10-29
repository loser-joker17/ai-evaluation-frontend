// Remembers which results already played their reveal, so revisits show instantly.
const KEY = "seen-results";
const MAX = 200;

export function hasSeen(evaluationId: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]).includes(evaluationId);
  } catch {
    return true;   // storage blocked: don't replay every time
  }
}

export function markSeen(evaluationId: string) {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
    if (!ids.includes(evaluationId)) {
      localStorage.setItem(KEY, JSON.stringify([evaluationId, ...ids].slice(0, MAX)));
    }
  } catch {
    // ignore
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}