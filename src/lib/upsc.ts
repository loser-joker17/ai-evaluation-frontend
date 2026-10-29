import type { Paper } from "@/api/types";

export const PAPERS: Paper[] = ["GS1", "GS2", "GS3", "GS4"];

/** Same rule as MarksOption on the backend. */
export function marksFor(paper: Paper): number[] {
  return paper === "GS4" ? [10, 20] : [10, 15];
}

export function wordLimitFor(marks: number): number {
  return marks === 10 ? 150 : 250;
}

/** Counts words exactly like the backend and the evaluator (Python's str.split()). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}