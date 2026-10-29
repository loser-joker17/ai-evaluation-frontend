import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ApiError } from "@/api/client";
import { submissionsApi } from "@/api/submissions";
import { IN_PROGRESS, type Submission } from "@/api/types";
import { FullScreenSpinner } from "@/components/FullScreenSpinner";
import { Button } from "@/components/ui/button";
import { EvaluationProgress } from "@/features/submission/EvaluationProgress";
import { useSubmission } from "@/features/submission/useSubmission";
import { queryKeys } from "@/lib/queryKeys";

/** Route wrapper: a new id gives a fresh page (timers, confirm state). */
export default function SubmissionRoute() {
  const { id } = useParams();
  return <SubmissionPage key={id} id={id!} />;
}

function SubmissionPage({ id }: { id: string }) {
  const { data: submission, isPending, error } = useSubmission(id);

  if (isPending) return <FullScreenSpinner />;
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="font-medium">{notFound ? "Answer not found" : "Couldn't load this answer"}</p>
        <Link to="/new" className="mt-2 inline-block text-sm underline">Write a new answer</Link>
      </div>
    );
  }

  const evaluation = submission.evaluation;
  const finished = evaluation?.status === "COMPLETED" || evaluation?.status === "REJECTED";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Header submission={submission} />

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</h2>
        <p className="mt-1 whitespace-pre-wrap font-medium">{submission.questionText}</p>
      </section>

      <section className="rounded-xl bg-muted/50 p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your answer</h2>
        <p className="mt-2 whitespace-pre-wrap leading-relaxed">{submission.answerText}</p>
      </section>

      {evaluation && !finished && <EvaluationProgress submissionId={id} evaluation={evaluation} />}

      {evaluation && finished && (
        // Replaced by the full ResultView in F3.2.
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">{evaluation.status}</p>
          {evaluation.totalScore !== null && (
            <p className="text-3xl font-semibold">{evaluation.totalScore} / {evaluation.maxMarks}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ submission }: { submission: Submission }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const running = submission.evaluation !== null && IN_PROGRESS.includes(submission.evaluation.status);

  const remove = useMutation({
    mutationFn: () => submissionsApi.remove(submission.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.submission(submission.id) });
      queryClient.removeQueries({ queryKey: queryKeys.result(submission.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      toast.success("Answer deleted");
      navigate("/new", { replace: true });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't delete. Please try again."),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {submission.paper} · {submission.maxMarks} marks · {submission.wordCount ?? 0}/{submission.wordLimit} words ·{" "}
        {new Date(submission.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
      </p>

      {!confirming ? (
        <Button variant="ghost" size="sm" disabled={running}
                title={running ? "You can delete it once the evaluation finishes" : undefined}
                onClick={() => setConfirming(true)}>
          Delete
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <span>Delete this answer and its feedback?</span>
          <Button variant="destructive" size="sm" disabled={remove.isPending} onClick={() => remove.mutate()}>
            {remove.isPending ? "Deleting…" : "Delete"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}