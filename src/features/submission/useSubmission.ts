import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { submissionsApi } from "@/api/submissions";
import { IN_PROGRESS, type EvaluationStatus } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";

const FAST = 5_000;
const SLOW = 15_000;
const FAST_FOR_MS = 2 * 60_000;

function isRunning(status: EvaluationStatus | undefined) {
  return status !== undefined && IN_PROGRESS.includes(status);
}

export function useSubmission(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.submission(id),
    queryFn: () => submissionsApi.get(id),
    refetchInterval: (q) => {
      const evaluation = q.state.data?.evaluation;
      if (!evaluation || !isRunning(evaluation.status)) return false;
      const age = Date.now() - new Date(evaluation.createdAt).getTime();
      return age < FAST_FOR_MS ? FAST : SLOW;
    },
    refetchIntervalInBackground: true,   // keep checking in a background tab
    retry: (count, error) => (error as { status?: number }).status !== 404 && count < 1,
  });

  // When an evaluation finishes: refresh the sidebar, and flag the tab if it's hidden.
  const status = query.data?.evaluation?.status;
  const previous = useRef(status);
  useEffect(() => {
    if (isRunning(previous.current) && status && !isRunning(status)) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      if (document.hidden) {
        flagTab(status === "COMPLETED" ? "✓ Result ready" : "Evaluation finished");
      }
    }
    previous.current = status;
  }, [status, queryClient]);

  return query;
}

function flagTab(text: string) {
  const original = document.title;
  document.title = `${text} · ${original}`;
  const restore = () => {
    if (!document.hidden) {
      document.title = original;
      document.removeEventListener("visibilitychange", restore);
    }
  };
  document.addEventListener("visibilitychange", restore);
}