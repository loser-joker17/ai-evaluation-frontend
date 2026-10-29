import { NavLink } from "react-router";

import type { SubmissionSummary } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function StatusBadge({ item }: { item: SubmissionSummary }) {
  switch (item.evaluationStatus) {
    case "COMPLETED":
      return <Badge variant="secondary">{item.totalScore}/{item.maxMarks}</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    case "REJECTED":
      return <Badge variant="outline">Rejected</Badge>;
    case null:
      return null;
    default:
      return <Badge variant="outline" className="animate-pulse">Evaluating</Badge>;
  }
}

export function HistoryItem({ item, onNavigate }: { item: SubmissionSummary; onNavigate?: () => void }) {
  return (
    <NavLink
      to={`/s/${item.id}`}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "block rounded-md px-3 py-2 text-sm hover:bg-accent",
          isActive && "bg-accent font-medium",
        )
      }
    >
      <p className="line-clamp-2">{item.questionPreview}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{item.paper} · {item.maxMarks}m</span>
        <StatusBadge item={item} />
      </div>
    </NavLink>
  );
}