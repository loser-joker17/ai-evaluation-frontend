import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

import { usersApi } from "@/api/users";
import type { DimensionProgress } from "@/api/types";
import { Segmented } from "@/components/Segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/queryKeys";

const TIPS: Record<string, string> = {
  relevance: "Answer exactly what the directive asks (discuss, examine, critically analyse) and cover every part of the question.",
  content_substantiation: "Back points with specifics: articles, reports, data, committees, examples.",
  analysis_depth: "Explain causes and consequences, weigh both sides, and show trade-offs instead of listing facts.",
  coverage_balance: "Cover all dimensions the question needs, with space spread sensibly between them.",
  structure_presentation: "Use a short introduction, clearly separated points, and a conclusion that answers the question.",
};

export default function ProgressPage() {
  const [last, setLast] = useState(10);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.progressFor(last),
    queryFn: () => usersApi.progress(last),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My progress</h1>
        <Segmented<number> label="Answers included" value={last} onChange={setLast}
                options={[10, 20, 50].map((n) => ({ value: n, label: `Last ${n}` }))} />
      </div>

      {isPending && <Skeleton className="h-64 w-full rounded-xl" />}

      {isError && (
        <p className="text-sm text-muted-foreground">
          Couldn't load your progress. <button className="underline" onClick={() => refetch()}>Try again</button>
        </p>
      )}

      {data && data.evaluatedAnswers === 0 && (
        <div className="rounded-xl border p-6 text-center">
          <p className="font-medium">Your progress appears after your first evaluated answer.</p>
          <Link to="/new" className="mt-2 inline-block text-sm underline">Write an answer</Link>
        </div>
      )}

      {data && data.evaluatedAnswers > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-5">
              <p className="text-sm text-muted-foreground">Average score</p>
              <p className="text-4xl font-semibold">{data.averageScorePercent ?? "–"}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                of the maximum marks, across your last {data.evaluatedAnswers}{" "}
                {data.evaluatedAnswers === 1 ? "answer" : "answers"}
              </p>
            </div>
            <FocusCard weakest={data.dimensions.find((d) => d.dimension === data.weakestDimension)} />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">By dimension</h2>
            {data.evaluatedAnswers < 2 && (
              <p className="text-sm text-muted-foreground">Trends appear once you have two or more evaluated answers.</p>
            )}
            {data.dimensions.map((d) => (
              <DimensionRow key={d.dimension} dimension={d} focus={d.dimension === data.weakestDimension} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function FocusCard({ weakest }: { weakest?: DimensionProgress }) {
  if (!weakest) return null;
  return (
    <div className="rounded-xl border p-5">
      <p className="text-sm text-muted-foreground">Focus next</p>
      <p className="text-lg font-semibold">{weakest.label}</p>
      <p className="mt-1 text-sm">{TIPS[weakest.dimension] ?? "This is your lowest-scoring dimension."}</p>
    </div>
  );
}

function DimensionRow({ dimension, focus }: { dimension: DimensionProgress; focus: boolean }) {
  const average = dimension.averagePercent ?? 0;
  const points = dimension.recentPercents.map((value, i) => ({ answer: i + 1, value }));

  return (
    <div className="grid items-center gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_160px]">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-medium">
            {dimension.label}
            {focus && <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal">Focus</span>}
          </h3>
          <span className="font-mono text-sm">{dimension.averagePercent ?? "–"}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted" role="img"
             aria-label={`${dimension.label}: ${average}% on average`}>
          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(average, 100)}%` }} />
        </div>
      </div>

      {points.length >= 2 && (
        // currentColor + text-primary: the line follows the theme, including dark mode.
        <div className="h-12 text-primary" aria-label={`${dimension.label} trend over your last ${points.length} answers`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 6, bottom: 4, left: 6 }}>
              <YAxis domain={[0, 100]} hide />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }} />
              <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={2}
                    dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: { answer: number; value: number } }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm">
      Answer {point.answer}: <span className="font-medium">{point.value}%</span>
    </div>
  );
}