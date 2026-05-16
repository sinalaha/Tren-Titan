import Anthropic from "@anthropic-ai/sdk";

import type { CoachContextSnapshot } from "@/server/ai/coachContext";
import { COACH_SYSTEM_PROMPT, formatCoachUserPrompt } from "@/server/ai/prompts/coach.prompt";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export function createCoachMessageStream(snapshot: CoachContextSnapshot, athleteMessage: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_COACH_MODEL ?? DEFAULT_MODEL;
  const snapshotJson = JSON.stringify(snapshot, null, 2);
  const userContent = formatCoachUserPrompt(snapshotJson, athleteMessage);

  return client.messages.stream({
    model,
    max_tokens: 2048,
    system: COACH_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }]
  });
}
