export function canAccessAiCoach(
  role: string | undefined,
  sub: { plan: string; status: string } | null | undefined
): boolean {
  if (role === "ADMIN" || role === "SUPERADMIN" || role === "PREMIUM") {
    return true;
  }
  if (!sub) {
    return false;
  }
  if (sub.plan.toLowerCase() === "premium") {
    return true;
  }
  if (sub.status === "TRIAL") {
    return true;
  }
  return false;
}
