import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { submissionsApi } from "@/api/submissions";
import type { DimensionResult, EvaluationResult, EvaluationSummary } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasSeen, markSeen, prefersReducedMotion } from "@/features/submission/seenResults";
import { useTypewriter } from "@/features/submission/useTypewriter";
import { queryKeys } from "@/lib/queryKeys";

export function ResultView({ submissionId, evaluation }: { submissionId: string; evaluation: EvaluationSummary }) {
  const { data: result, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.result(submissionId, evaluation.id),
    queryFn: () => submissionsApi.result(submissionId),
    staleTime: Number.POSITIVE_INFINITY,   // a finished result never changes
  });

  if (isPending) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Couldn't load the feedback. <button className="underline" onClick={() => refetch()}>Try again</button>
      </p>
    );
  }
  if (result.status === "REJECTED") return <Rejected result={result} />;
  return <Completed result={result} />;
}

function Rejected({ result }: { result: EvaluationResult }) {
  return (
    <div className="rounded-xl border p-5">
      <p className="font-medium">This couldn't be evaluated as an answer</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {(result.rejectionReasons.length ? result.rejectionReasons : ["The evaluator rejected this input."]).map(
          (reason, i) => <li key={i}>{reason}</li>,
        )}
      </ul>
    </div>
  );
}

function Completed({ result }: { result: EvaluationResult }) {
  // Decide once, on first render: animate only the first time, and never with reduced motion.
  const [animate] = useState(() => !hasSeen(result.evaluationId) && !prefersReducedMotion());
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markSeen(result.evaluationId);
    if (animate) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result.evaluationId, animate]);

  // Every animated text, in reading order. Indexes below must follow the same order.
  const blocks = useMemo(() => {
    const list: string[] = [];
    for (const d of result.dimensions) {
      list.push(d.justification ?? "", d.improvement ?? "");
    }
    list.push(...result.strengths, ...result.weaknesses, ...result.improvementSuggestions, result.overallFeedback ?? "");
    return list;
  }, [result]);

  const typer = useTypewriter(blocks, animate);

  let index = 0;
  const next = () => typer.text(index++);

  const dimensionTexts = result.dimensions.map(() => ({ justification: next(), improvement: next() }));
  const strengths = result.strengths.map(next);
  const weaknesses = result.weaknesses.map(next);
  const suggestions = result.improvementSuggestions.map(next);
  const overall = next();

  return (
    <div ref={topRef} className="scroll-mt-4 space-y-6">
      <ScoreHeader result={result} />

      {result.factualFlags.length > 0 && <FactualFlags result={result} />}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Marks by dimension</h2>
        {result.dimensions.map((d, i) => (
          <DimensionCard key={d.dimension} dimension={d} {...dimensionTexts[i]} />
        ))}
      </section>

      <ListSection title="Strengths" items={strengths} marker="✓" />
      <ListSection title="Weaknesses" items={weaknesses} marker="!" />
      <ListSection title="How to improve" items={suggestions} marker="→" />

      {overall && (
        <section className="rounded-xl bg-muted/50 p-5">
          <h2 className="text-sm font-semibold">Overall</h2>
          <p className="mt-1 leading-relaxed">{overall}</p>
        </section>
      )}

      {!typer.done && (
        <div className="sticky bottom-4 flex justify-center">
          <Button variant="secondary" className="shadow-md" onClick={typer.skip}>Show all</Button>
        </div>
      )}
    </div>
  );
}

function ScoreHeader({ result }: { result: EvaluationResult }) {
  const over = result.wordLimitStatus === "over_limit";
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border p-5">
      <div>
        <p className="text-sm text-muted-foreground">Your score</p>
        <p className="text-4xl font-semibold">
          {result.totalScore ?? "–"}
          <span className="text-xl text-muted-foreground"> / {result.maxMarks}</span>
        </p>
      </div>
      {result.wordCount !== null && result.wordLimit !== null && (
        <p className={over ? "text-sm text-amber-600" : "text-sm text-muted-foreground"}>
          {result.wordCount} / {result.wordLimit} words {over ? "· over the limit" : "✓"}
        </p>
      )}
    </div>
  );
}

function DimensionCard({ dimension, justification, improvement }: {
  dimension: DimensionResult; justification: string; improvement: string;
}) {
  const percent = dimension.score !== null && dimension.maxScore
    ? Math.round((dimension.score / dimension.maxScore) * 100) : 0;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium">{dimension.label}</h3>
        <span className="font-mono text-sm">{dimension.score ?? "–"} / {dimension.maxScore ?? "–"}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {justification && <p className="mt-3 text-sm leading-relaxed">{justification}</p>}
      {dimension.evidence.length > 0 && (
        <ul className="mt-2 space-y-1">
          {dimension.evidence.map((quote, i) => (
            <li key={i} className="border-l-2 pl-3 text-sm italic text-muted-foreground">"{quote}"</li>
          ))}
        </ul>
      )}
      {improvement && (
        <p className="mt-3 text-sm"><span className="font-medium">Improve: </span>{improvement}</p>
      )}
    </div>
  );
}

function ListSection({ title, items, marker }: { title: string; items: string[]; marker: string }) {
  const visible = items.filter((text) => text !== "");
  if (visible.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-2 space-y-2">
        {visible.map((text, i) => (
          <li key={i} className="flex gap-3 leading-relaxed">
            <span className="text-muted-foreground" aria-hidden>{marker}</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FactualFlags({ result }: { result: EvaluationResult }) {
  return (
    <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <h2 className="font-semibold">Check these facts</h2>
      <ul className="mt-2 space-y-3">
        {result.factualFlags.map((flag, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium">"{flag.claim}"</p>
            {flag.explanation && <p className="mt-1 text-muted-foreground">{flag.explanation}</p>}
            {flag.sources.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                 className="mt-1 block truncate text-xs underline">{url}</a>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}