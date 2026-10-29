export const queryKeys = {
  submissions: ["submissions"] as const,
  submission: (id: string) => ["submission", id] as const,
  result: (id: string) => ["result", id] as const,
  quota: ["quota"] as const,
  progress: ["progress"] as const,
};