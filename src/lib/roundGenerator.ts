// src/lib/roundGenerator.ts
import { Question } from "../types/future";

// Generate a small set of varied fallback questions when no LLM is available.
export function generateFallbackQuestions(
  previousRounds: any[],
  requestedRoundNumber: number,
  maxQuestions = 4
): Question[] {
  const lastRound = previousRounds && previousRounds.length > 0 ? previousRounds[previousRounds.length - 1] : undefined;
  const snippet = (lastRound?.questions?.[0]?.answer ?? "").toString().slice(0, 120).trim();

  const templates = [
    {
      id: `concern_${requestedRoundNumber}`,
      prompt: (s: string) => `What concerns or obstacles do you foresee in pursuing "${s || 'this direction'}"?`,
      type: "text",
      category: "personal",
    },
    {
      id: `next_step_${requestedRoundNumber}`,
      prompt: (s: string) => `What is one small, concrete step you could take next month toward "${s || 'this goal'}"?`,
      type: "text",
      category: "personal",
    },
    {
      id: `confidence_${requestedRoundNumber}`,
      prompt: (_: string) => `How confident are you about moving forward on this (Low / Medium / High)?`,
      type: "select",
      category: "personal",
      options: ["Low", "Medium", "High"],
    },
    {
      id: `resources_${requestedRoundNumber}`,
      prompt: (s: string) => `What resources, people, or skills would help you make progress toward "${s || 'this'}"?`,
      type: "text",
      category: "personal",
    },
    {
      id: `time_horizon_${requestedRoundNumber}`,
      prompt: (_: string) => `What is a reasonable time horizon for seeing meaningful progress (months / 1-2 years / 3-5 years)?`,
      type: "select",
      category: "personal",
      options: ["Months", "1-2 years", "3-5 years"],
    },
  ];

  // Choose up to maxQuestions templates but avoid always picking the same ones
  const chosen: Question[] = [];
  for (let i = 0; i < Math.min(maxQuestions, templates.length); i++) {
    const t = templates[(i + (requestedRoundNumber % templates.length)) % templates.length];
    const id = `${t.id}`;
    const promptText = t.prompt(snippet);
    const q: Question = {
      id,
      roundNumber: requestedRoundNumber,
      prompt: promptText,
      type: t.type as any,
      category: t.category as any,
    };
    if ((t as any).options) q.options = (t as any).options;
    chosen.push(q);
  }

  return chosen;
}
