/** Start of the UTC calendar day for `d` (00:00:00.000Z). Used for streaks and “today” telemetry. */
export function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
