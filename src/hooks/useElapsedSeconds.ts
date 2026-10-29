import { useEffect, useState } from "react";

/** Seconds since `since`, ticking every second while `active`. */
export function useElapsedSeconds(since: string | undefined, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!since) return 0;
  return Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}