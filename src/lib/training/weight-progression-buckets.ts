/** UTC Monday (YYYY-MM-DD) for the week containing `d`. */
export function utcWeekStartKey(d: Date): string {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = dt.getUTCDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - daysFromMon);
  return dt.toISOString().slice(0, 10);
}

/** UTC month bucket YYYY-MM. */
export function utcMonthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function weightProgressBucketKey(d: Date, grain: "week" | "month"): string {
  return grain === "week" ? utcWeekStartKey(d) : utcMonthKey(d);
}
