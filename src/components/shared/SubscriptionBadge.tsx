import { cn } from "@/lib/utils";

interface SubscriptionBadgeProps {
  plan: string;
  status: string;
  className?: string;
}

function badgeTone(plan: string, status: string) {
  if (status === "PAST_DUE") {
    return "border-rose-400/40 bg-rose-500/15 text-rose-200";
  }
  if (plan === "premium" && status === "ACTIVE") {
    return "border-cyan-400/40 bg-cyan-500/10 text-cyan-200";
  }
  if (plan === "premium") {
    return "border-purple-400/35 bg-purple-500/10 text-purple-200";
  }
  return "border-white/20 bg-white/5 text-white/70";
}

function displayPlan(plan: string): string {
  const p = plan.toLowerCase();
  if (p === "premium") return "PRO";
  if (p === "free") return "FREE";
  return plan.toUpperCase();
}

export function SubscriptionBadge({ plan, status, className }: SubscriptionBadgeProps) {
  const label = `${displayPlan(plan)} · ${status}`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]",
        badgeTone(plan, status),
        className
      )}
    >
      {label}
    </span>
  );
}
