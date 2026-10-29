import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { submissionsApi } from "@/api/submissions";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/auth/authStore";
import { FormField } from "@/components/FormField";
import { Segmented } from "@/components/Segmented";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { clearDraft, loadDraft, saveDraft } from "@/features/compose/draft";
import { applyServerErrors } from "@/lib/forms";
import { queryKeys } from "@/lib/queryKeys";
import { countWords, marksFor, PAPERS, wordLimitFor } from "@/lib/upsc";
import { cn } from "@/lib/utils";

// Same limits as CreateSubmissionRequest and MarksOption on the backend.
const schema = z
  .object({
    paper: z.enum(["GS1", "GS2", "GS3", "GS4"]),
    maxMarks: z.number(),
    questionText: z.string().trim()
      .min(5, "The question must be at least 5 characters")
      .max(5000, "The question must be at most 5,000 characters"),
    answerText: z.string().trim()
      .min(1, "Write your answer")
      .max(15000, "The answer must be at most 15,000 characters"),
  })
  .refine((v) => marksFor(v.paper).includes(v.maxMarks), {
    path: ["maxMarks"],
    message: "These marks aren't used for this paper",
  });

type ComposeValues = z.infer<typeof schema>;

const EMPTY: ComposeValues = { paper: "GS2", maxMarks: 10, questionText: "", answerText: "" };

export default function ComposePage() {
  const userId = useAuthStore((state) => state.user!.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveTimer = useRef<number | undefined>(undefined);

  const quota = useQuery({ queryKey: queryKeys.quota, queryFn: usersApi.quota });

  const {
    register, handleSubmit, setValue, watch, setError,
    formState: { errors, isSubmitting },
  } = useForm<ComposeValues>({
    resolver: zodResolver(schema),
    defaultValues: loadDraft(userId) ?? EMPTY,
  });

  // Save the draft 0.5 s after typing stops.
  useEffect(() => {
    const subscription = watch((values) => {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => saveDraft(userId, values as ComposeValues), 500);
    });
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(saveTimer.current);
    };
  }, [watch, userId]);

  const paper = watch("paper");
  const maxMarks = watch("maxMarks");
  const words = countWords(watch("answerText") ?? "");
  const wordLimit = wordLimitFor(maxMarks);
  const overBy = words - wordLimit;

  const remaining = quota.data?.remainingToday;
  const quotaUsedUp = remaining !== undefined && remaining <= 0;

  function changePaper(next: ComposeValues["paper"]) {
    setValue("paper", next);
    if (!marksFor(next).includes(maxMarks)) {
      setValue("maxMarks", 10);
    }
  }

  async function onSubmit(values: ComposeValues) {
    try {
      const created = await submissionsApi.create(values);
      window.clearTimeout(saveTimer.current);   // no late draft save after this
      clearDraft(userId);
      queryClient.setQueryData(queryKeys.submission(created.id), created);
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota });
      navigate(`/s/${created.id}`);
    } catch (error) {
      applyServerErrors(error, setError);
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota });   // e.g. 429: show the real count
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold">New answer</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Write as you would in the exam. Evaluation takes about 3–6 minutes.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-6">
        <div className="flex flex-wrap gap-6">
          <div className="grid gap-2">
            <span className="text-sm font-medium">Paper</span>
            <Segmented label="Paper" value={paper} onChange={changePaper}
                       options={PAPERS.map((p) => ({ value: p, label: p }))} />
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Marks</span>
            <Segmented label="Marks" value={maxMarks}
                       onChange={(m) => setValue("maxMarks", m, { shouldValidate: true })}
                       options={marksFor(paper).map((m) => ({
                         value: m,
                         label: paper === "GS4" && m === 20 ? "20 (case study)" : String(m),
                       }))} />
            {errors.maxMarks && <p className="text-sm text-destructive">{errors.maxMarks.message}</p>}
          </div>
        </div>

        <FormField id="questionText" label="Question" error={errors.questionText?.message}>
          <Textarea id="questionText" rows={3} placeholder="Paste the question exactly as asked"
                    aria-invalid={!!errors.questionText} {...register("questionText")} />
        </FormField>

        <FormField id="answerText" label="Your answer" error={errors.answerText?.message}>
          <Textarea id="answerText" rows={16} className="leading-relaxed"
                    placeholder="Introduction, body, conclusion…"
                    aria-invalid={!!errors.answerText} {...register("answerText")} />
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm">
            <span className={cn("font-medium", overBy > 0 && "text-amber-600")}>
              {words} / {wordLimit} words
            </span>
            {overBy > 0 && (
              <span className="ml-2 text-amber-600">
                {overBy} over the limit; examiners penalise this
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {quota.data && (
              <span className="text-sm text-muted-foreground">
                {quotaUsedUp
                  ? `Daily limit reached. Resets at ${new Date(quota.data.resetsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : `${remaining} of ${quota.data.dailyLimit} left today`}
              </span>
            )}
            <Button type="submit" disabled={isSubmitting || quotaUsedUp}>
              {isSubmitting ? "Submitting…" : "Evaluate answer"}
            </Button>
          </div>
        </div>

        {errors.root?.server && (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {errors.root.server.message}
          </p>
        )}
      </form>
    </div>
  );
}