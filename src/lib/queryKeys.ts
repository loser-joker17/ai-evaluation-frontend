export const queryKeys = {
  submissions: ["submissions"] as const,
  submission: (id: string) => ["submission", id] as const,
  // ["result", submissionId] alone matches every attempt of that submission (used on delete).
  result: (submissionId: string, evaluationId?: string) =>
    evaluationId ? (["result", submissionId, evaluationId] as const) : (["result", submissionId] as const),
  quota: ["quota"] as const,
  progress: ["progress"] as const,
};

