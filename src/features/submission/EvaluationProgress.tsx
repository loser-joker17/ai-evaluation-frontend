import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/api/client";
import { submissionsApi } from "@/api/submissions";
import type { EvaluationSummary } from "@/api/types";
import { Button } from "@/components/ui/button";
import { formatDuration, useElapsedSeconds } from "@/hooks/useElapsedSeconds";
import { queryKeys } from "@/lib/queryKeys";

const FAILURE_TEXT: Record<string, string> = {
  EVALUATOR_FAILED: "The evaluator ran into a problem with this answer.",
  TIMEOUT: "The evaluation took too long and was stopped.",
  LOST: "The evaluation was interrupted.",
  CONTRACT: "We couldn't send your answer for evaluation.",
};

export function EvaluationProgress({ submissionId, evaluation }: { submissionId: string; evaluation: EvaluationSummary }) {
  const running = evaluation.status === "PENDING" || evaluation.status === "QUEUED" || evaluation.status === "RUNNING";
  const elapsed = useElapsedSeconds(evaluation.createdAt, running);

  if (evaluation.status === "FAILED") {
    return <FailedCard submissionId={submissionId} evaluation={evaluation} />;
  }

  const inQueue = evaluation.status !== "RUNNING";
  return (
    <div className="rounded-xl border p-5" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="font-medium">{inQueue ? "Waiting in the queue…" : "Evaluating your answer…"}</p>
        <span className="ml-auto font-mono text-sm text-muted-foreground">{formatDuration(elapsed)}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        This usually takes 3–6 minutes. You can leave this page; your result will be saved here.
      </p>
      {elapsed > 10 * 60 && (
        <p className="mt-2 text-sm text-muted-foreground">
          It's taking longer than usual. The evaluator is busy, but your answer is still in line.
        </p>
      )}
    </div>
  );
}

function FailedCard({ submissionId, evaluation }: { submissionId: string; evaluation: EvaluationSummary }) {
  const queryClient = useQueryClient();
  const retry = useMutation({
    mutationFn: () => submissionsApi.retry(submissionId),
    onSuccess: (submission) => {
      queryClient.setQueryData(queryKeys.submission(submissionId), submission);
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't retry. Please try again.");
    },
  });

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <p className="font-medium">This answer couldn't be evaluated</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {FAILURE_TEXT[evaluation.errorCode ?? ""] ?? "Something went wrong."} Retrying doesn't use your daily quota.
      </p>
      <Button className="mt-4" onClick={() => retry.mutate()} disabled={retry.isPending}>
        {retry.isPending ? "Retrying…" : "Retry evaluation"}
      </Button>
    </div>
  );
}