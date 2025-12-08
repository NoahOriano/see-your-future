// api/generate-future.ts
// Server endpoint to generate the final future using Gemini (Google Generative AI).
// Expects POST { rounds: QuestionRound[] }

import { generateFuturePrompt } from "../src/lib/prompts";
import { GeminiChatHandler } from "../src/lib/geminiChatHandler";
import type { IncomingMessage, ServerResponse } from "http";
import { QuestionRound } from "../src/types/future";

interface RequestBody {
  rounds: QuestionRound[];
  imageBase64?: string;
  imageMimeType?: string;
  imageDescription?: string;
}

interface RequestWithBody extends IncomingMessage {
    body?: RequestBody;
}

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const { rounds, imageBase64, imageMimeType, imageDescription } = req.body ?? {};
  if (!rounds) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Missing rounds in request body" }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.statusCode = 501;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Server not configured for Gemini (GEMINI_API_KEY missing)" }));
    return;
  }

  // Build transcript server-side (simple mirror of client helper)
  function buildRoundsTranscript(roundsLocal: QuestionRound[]): string {
    return roundsLocal
      .map((round) => {
        const header = `Round ${round.roundNumber} (${round.source} - ${round.label})`;
        const qas = (round.questions || [])
          .map((q, idx) => {
            const answerText = (q.answer ?? "").toString().trim();
            return [`  Q${idx + 1}: ${q.prompt}`, `  A${idx + 1}: ${answerText || "(no answer)"}`].join("\n");
          })
          .join("\n");
        return `${header}\n${qas}`;
      })
      .join("\n\n");
  }

  const transcript = buildRoundsTranscript(rounds);
  let prompt = generateFuturePrompt(transcript);
  if (imageDescription) {
    prompt += `\n\nThe user has also provided an image of themselves. Here is a description of the image: ${imageDescription}`;
  }


  try {
    const handler = new GeminiChatHandler({ apiKey, modelName: "gemini-2.5-flash" });
    const raw = await handler.sendMessage(prompt, { imageBase64: imageBase64 ?? null, imageMimeType: imageMimeType ?? null });

    // Try to extract JSON from the model response
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    let parsed: Record<string, unknown> | null = null;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch {
        // ignore parse error
      }
    }

    if (parsed) {
      const description = typeof parsed.description === "string" ? parsed.description : raw;
      const scoreNum = Number(parsed.qualityScore);
      const qualityScore = Number.isFinite(scoreNum) ? scoreNum : 75;
      const qualityLabel = typeof parsed.qualityLabel === "string" ? parsed.qualityLabel : "Inferred";
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ description, qualityScore, qualityLabel }));
      return;
    }

    // If parsing failed, return raw text
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ description: raw, qualityScore: 75, qualityLabel: "Unstructured Response" }));
  } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("generate-future error:", e);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: e.message ?? String(e) }));
        return;
      }
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: "Unknown error" }));
  }
}
