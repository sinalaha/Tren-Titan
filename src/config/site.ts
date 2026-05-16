/** Public site URL — prefer `NEXT_PUBLIC_APP_URL` (validated in `getServerEnv` on server). */
export function getPublicAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}
