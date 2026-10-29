import { Link, NavLink, useNavigate } from "react-router";

import type { SubmissionSummary } from "@/api/types";
import { useAuthStore } from "@/auth/authStore";
import { logout } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryItem } from "@/features/history/HistoryItem";
import { useSubmissionsInfinite } from "@/features/history/useSubmissionsInfinite";
import { dateGroup, type DateGroup } from "@/lib/dates";
import { cn } from "@/lib/utils";

const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "Previous 7 days", "Older"];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { data, isPending, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSubmissionsInfinite();

  const items = data?.pages.flatMap((page) => page.content) ?? [];
  const groups = new Map<DateGroup, SubmissionSummary[]>();
  for (const item of items) {
    const group = dateGroup(item.createdAt);
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Link to="/new" onClick={onNavigate}
              className="flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + New answer
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Your answers">
        {isPending && (
          <div className="space-y-2 px-1">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        )}

        {isError && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Couldn't load your answers.{" "}
            <button className="underline" onClick={() => refetch()}>Try again</button>
          </div>
        )}

        {!isPending && !isError && items.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            Your evaluated answers will appear here.
          </p>
        )}

        {GROUP_ORDER.filter((g) => groups.has(g)).map((group) => (
          <section key={group} className="mt-3">
            <h2 className="px-3 pb-1 text-xs font-medium text-muted-foreground">{group}</h2>
            {groups.get(group)!.map((item) => (
              <HistoryItem key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </section>
        ))}

        {hasNextPage && (
          <Button variant="ghost" size="sm" className="mt-2 w-full"
                  disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? "Loading…" : "Show older"}
          </Button>
        )}
      </nav>

      <div className="border-t p-3 text-sm">
        <NavLink to="/progress" onClick={onNavigate}
                 className={({ isActive }) => cn("block rounded-md px-3 py-2 hover:bg-accent", isActive && "bg-accent font-medium")}>
          My progress
        </NavLink>
        <div className="mt-2 flex items-center justify-between px-3">
          <span className="truncate text-muted-foreground">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
        </div>
      </div>
    </div>
  );
}