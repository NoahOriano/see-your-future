// api/request-next-round.ts
// Server endpoint to provide the next round. For Round 2 it selects prebuilt
// questions; for Round 3+ it can call Gemini to generate follow-up questions.

import prebuiltQuestionsJson from "../src/data/prebuiltQuestions.json";
import { generateRoundQuestionsPrompt } from "../src/lib/prompts";
import { GeminiChatHandler } from "../src/lib/geminiChatHandler";

function parseAgeFromRound1(round1: any): number | null {
  if (!round1) return null;
  const ageQ = (round1.questions || []).find((q: any) => q.id === "age");
  if (!ageQ || !ageQ.answer) return null;
  const n = parseInt(ageQ.answer, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractInterestsFromRound1(round1: any): Record<string, number> {
  const interests: Record<string, number> = {};
  if (!round1) return interests;

  for (const q of round1.questions || []) {
    if (q.type === "slider" && q.category) {
      const v = Number(q.answer ?? "0");
      const clamped = Math.max(0, Math.min(5, Number.isFinite(v) ? v : 0));
      interests[q.category] = clamped;
    }
  }

  return interests;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { previousRounds, requestedRoundNumber } = req.body ?? {};
  if (!previousRounds || typeof requestedRoundNumber !== "number") {
    return res.status(400).json({ error: "Missing previousRounds or requestedRoundNumber" });
  }

  // Round 2: select from prebuilt question bank
  if (requestedRoundNumber === 2) {
    const prebuilt: any[] = prebuiltQuestionsJson as any;
    const round1 = previousRounds.find((r: any) => r.roundNumber === 1);
    const age = parseAgeFromRound1(round1);
    const interests = extractInterestsFromRound1(round1);

    function scorePrebuiltQuestion(q: any): number {
      if (typeof q.ageMin === "number" && age !== null && age < q.ageMin) return -Infinity;
      if (typeof q.ageMax === "number" && age !== null && age > q.ageMax) return -Infinity;
      const ratings = q.categoryRatings ?? {};
      let score = 0;
      for (const [cat, rating] of Object.entries(ratings)) {
        const interest = interests[cat as string] ?? 0;
        score += (rating as number) * interest;
      }
      return score;
    }

    const scored = prebuilt.map((q: any) => ({ question: q, score: scorePrebuiltQuestion(q) }));
    const valid = scored.filter((s: any) => s.score !== -Infinity);
    valid.sort((a: any, b: any) => b.score - a.score);
    const best = valid.slice(0, 10).map((s: any) => ({ ...s.question, roundNumber: 2 }));

    const round = {
      roundNumber: 2,
      label: "Round 2: Tailored Questions",
      source: "prebuilt",
      questions: best,
    };

    return res.status(200).json({ round });
  }

  // Round 3+ : try to use Gemini to generate questions
  if (requestedRoundNumber >= 3) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const transcript = (previousRounds || []).map((r: any) => {
      const header = `Round ${r.roundNumber} (${r.source} - ${r.label})`;
      const qas = (r.questions || [])
        .map((q: any, idx: number) => {
          const answerText = (q.answer ?? "").toString().trim();
          return [`  Q${idx + 1}: ${q.prompt}`, `  A${idx + 1}: ${answerText || "(no answer)"}`].join("\n");
        })
        .join("\n");
      return `${header}\n${qas}`;
    }).join("\n\n");

    if (!apiKey) {
      // Fallback to a slightly smarter local generator to avoid repeating the
      // same two template questions on every generated round.
      // Import lazily to avoid circular require issues in some envs.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { generateFallbackQuestions } = require("../src/lib/roundGenerator");

      const generatedQuestions = generateFallbackQuestions(previousRounds, requestedRoundNumber, 4);

      const round = {
        roundNumber: requestedRoundNumber,
        label: `Round ${requestedRoundNumber}: Generated Questions`,
        source: "generated",
        questions: generatedQuestions,
      };

      return res.status(200).json({ round });
    }

    const prompt = generateRoundQuestionsPrompt(transcript, requestedRoundNumber);

    try {
      const handler = new GeminiChatHandler({ apiKey, modelName: "gemini-2.5-flash" });
      const raw = await handler.sendMessage(prompt);
      // Expect the model to return a JSON array
      let arr: any[] = [];
      try {
        arr = JSON.parse(raw.trim());
      } catch (e) {
        // Try to extract JSON substring
        const first = raw.indexOf("[");
        const last = raw.lastIndexOf("]");
        if (first !== -1 && last !== -1 && last > first) {
          try { arr = JSON.parse(raw.slice(first, last + 1)); } catch (_) {}
        }
      }

      if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error("LLM did not return a question array");
      }

      const questions = arr.map((q: any, idx: number) => ({
        id: q.id ?? `g_${requestedRoundNumber}_${idx}`,
        roundNumber: requestedRoundNumber,
        prompt: q.prompt ?? String(q.text ?? ""),
        type: q.type ?? "text",
        category: q.category,
        options: Array.isArray(q.options) ? q.options : undefined,
      }));

      const round = {
        roundNumber: requestedRoundNumber,
        label: `Round ${requestedRoundNumber}: Generated Questions`,
        source: "generated",
        questions,
      };

      return res.status(200).json({ round });
    } catch (e: any) {
      console.error("request-next-round error:", e);
      // Fallback to static questions
      const lastRound = previousRounds.length > 0 ? previousRounds[previousRounds.length - 1] : undefined;
      const snippet = lastRound?.questions?.[0]?.answer?.slice(0, 40) ?? "";
      const generatedQuestions = [
        {
          id: "future_doubts",
          roundNumber: requestedRoundNumber,
          prompt: `What concerns do you have about moving toward "${snippet}..."?`,
          type: "text",
          category: "personal",
        },
        {
          id: "support_network",
          roundNumber: requestedRoundNumber,
          prompt: "How strong is your current support network (friends, family, mentors)?",
          type: "select",
          category: "relationships",
          options: ["Weak", "Average", "Strong"],
        },
      ];

      const round = {
        roundNumber: requestedRoundNumber,
        label: `Round ${requestedRoundNumber}: Generated Questions`,
        source: "generated",
        questions: generatedQuestions,
      };

      return res.status(200).json({ round });
    }
  }

  return res.status(200).json({ round: null });
}
