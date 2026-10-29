import { useInfiniteQuery } from "@tanstack/react-query";

import { submissionsApi } from "@/api/submissions";
import { IN_PROGRESS } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";

export function useSubmissionsInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.submissions,
    queryFn: ({ pageParam }) => submissionsApi.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    // While any listed answer is still being evaluated, refresh the list every 15 s
    // so its badge turns into a score without a page reload.
    refetchInterval: (query) => {
      const pages = query.state.data?.pages ?? [];
      const anyRunning = pages.some((page) =>
        page.content.some((s) => s.evaluationStatus !== null && IN_PROGRESS.includes(s.evaluationStatus)),
      );
      return anyRunning ? 15_000 : false;
    },
  });
}