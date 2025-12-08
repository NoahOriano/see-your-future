// api/generate-future.ts
// Server endpoint to generate the final future using Gemini (Google Generative AI).
// Expects POST { rounds: QuestionRound[] }

import { generateFuturePrompt } from "../src/lib/prompts";
import { GeminiChatHandler } from "../src/lib/geminiChatHandler";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { rounds } = req.body ?? {};
  if (!rounds) return res.status(400).json({ error: "Missing rounds in request body" });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "Server not configured for Gemini (GEMINI_API_KEY missing)" });
  }

  // Build transcript server-side (simple mirror of client helper)
  function buildRoundsTranscript(roundsLocal: any[]): string {
    return roundsLocal
      .map((round) => {
        const header = `Round ${round.roundNumber} (${round.source} - ${round.label})`;
        const qas = (round.questions || [])
          .map((q: any, idx: number) => {
            const answerText = (q.answer ?? "").toString().trim();
            return [`  Q${idx + 1}: ${q.prompt}`, `  A${idx + 1}: ${answerText || "(no answer)"}`].join("\n");
          })
          .join("\n");
        return `${header}\n${qas}`;
      })
      .join("\n\n");
  }

  const transcript = buildRoundsTranscript(rounds);
  const prompt = generateFuturePrompt(transcript);

  try {
    const handler = new GeminiChatHandler({ apiKey, modelName: "gemini-2.5-flash" });
    const raw = await handler.sendMessage(prompt);

    // Try to extract JSON from the model response
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    let parsed: any = null;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch (e) {
        // ignore parse error
      }
    }

    if (parsed) {
      const description = typeof parsed.description === "string" ? parsed.description : raw;
      const scoreNum = Number(parsed.qualityScore);
      const qualityScore = Number.isFinite(scoreNum) ? scoreNum : 75;
      const qualityLabel = typeof parsed.qualityLabel === "string" ? parsed.qualityLabel : "Inferred";

      return res.status(200).json({ description, qualityScore, qualityLabel });
    }

    // If parsing failed, return raw text
    return res.status(200).json({ description: raw, qualityScore: 75, qualityLabel: "Unstructured Response" });
  } catch (e: any) {
    console.error("generate-future error:", e);
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}
