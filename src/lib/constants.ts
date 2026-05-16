/** Daily water target for hydration % (ml). */
export const DASHBOARD_HYDRATION_GOAL_ML = 3000;

/** Soft targets for dashboard nutrition bars (UTC day totals). */
export const DASHBOARD_CALORIES_GOAL_KCAL = 3700;
export const DASHBOARD_PROTEIN_GOAL_G = 210;

/** Default RPE when not logged on a workout. */
export const DEFAULT_WORKOUT_RPE = 7;

/** Sliding-window cap for food image analysis per user (single-instance memory; use Redis in multi-instance). */
export const AI_ANALYZE_RATE_WINDOW_MS = 60_000;
export const AI_ANALYZE_MAX_REQUESTS_PER_WINDOW = 20;

/** Coach chat streaming endpoint (per user). */
export const AI_COACH_RATE_WINDOW_MS = 60_000;
export const AI_COACH_MAX_REQUESTS_PER_WINDOW = 25;

/** Public registration endpoint — per IP (single-instance memory; Upstash when configured). */
export const REGISTER_RATE_WINDOW_MS = 3_600_000;
export const REGISTER_MAX_ATTEMPTS_PER_IP_PER_WINDOW = 8;
