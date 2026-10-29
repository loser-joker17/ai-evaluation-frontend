export type DateGroup = "Today" | "Yesterday" | "Previous 7 days" | "Older";

const DAY = 24 * 60 * 60 * 1000;

/** Groups like ChatGPT's sidebar, using the browser's own time zone. */
export function dateGroup(iso: string, now = new Date()): DateGroup {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = new Date(iso).getTime();
  if (time >= startOfToday) return "Today";
  if (time >= startOfToday - DAY) return "Yesterday";
  if (time >= startOfToday - 7 * DAY) return "Previous 7 days";
  return "Older";
}