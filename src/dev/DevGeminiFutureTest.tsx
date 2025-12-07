// src/dev/DevGeminiFutureTest.tsx

import React, { useState } from "react";
import {
  Question,
  QuestionRound,
  QuestionCategory,
} from "../types/future";
import {
  GeminiChatHandler,
  ChatHandlerConfig,
} from "../lib/geminiChatHandler";

// ---------- Helper functions (same behavior as in home.tsx) ----------

function buildRoundsTranscript(rounds: QuestionRound[]): string {
  return rounds
    .map((round) => {
      const header = `Round ${round.roundNumber} (${round.source} - ${round.label})`;
      const qas = round.questions
        .map((q, idx) => {
          const answerText = (q.answer ?? "").trim();
          return [
            `  Q${idx + 1}: ${q.prompt}`,
            `  A${idx + 1}: ${answerText || "(no answer)"}`,
          ].join("\n");
        })
        .join("\n");
      return `${header}\n${qas}`;
    })
    .join("\n\n");
}

function extractJsonObjectFromText(text: string): any {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("No JSON object found in model response. Raw text:\n" + text);
  }
  const jsonStr = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}

// ---------- Fake data to simulate your rounds ----------

function buildFakeRounds(): QuestionRound[] {
  const round1Questions: Question[] = [
    {
      id: "age",
      roundNumber: 1,
      prompt: "How old are you? (Number only)",
      type: "text",
      answer: "24",
    },
    {
      id: "primary_goal",
      roundNumber: 1,
      prompt: "What is your primary focus or desire for the next 10 years?",
      type: "text",
      answer:
        "Build a meaningful career in software while maintaining good health and relationships.",
    },
    {
      id: "interest_career",
      roundNumber: 1,
      prompt: "How interested are you in shaping your work or career path?",
      type: "slider",
      category: "career" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "5",
    },
    {
      id: "interest_health",
      roundNumber: 1,
      prompt:
        "How important is your long-term physical and mental health to you?",
      type: "slider",
      category: "health" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "4",
    },
    {
      id: "interest_relationships",
      roundNumber: 1,
      prompt: "How much priority do you place on relationships and community?",
      type: "slider",
      category: "relationships" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "3",
    },
    {
      id: "interest_finance",
      roundNumber: 1,
      prompt: "How focused are you on your financial future and stability?",
      type: "slider",
      category: "finance" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "4",
    },
    {
      id: "interest_personal",
      roundNumber: 1,
      prompt:
        "How strongly are you drawn to personal growth, identity, and meaning?",
      type: "slider",
      category: "personal" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "5",
    },
  ];

  const round2Questions: Question[] = [
    {
      id: "career_growth",
      roundNumber: 2,
      prompt:
        "How important is long-term growth and advancement in your work or career?",
      type: "text",
      category: "career",
      answer:
        "Very important, I want to keep learning and taking on more responsibility.",
    },
    {
      id: "health_routine",
      roundNumber: 2,
      prompt:
        "Describe your current routine for sleep, exercise, and nutrition.",
      type: "text",
      category: "health",
      answer:
        "I sleep 7 hours, exercise moderately 3 times a week, and try to eat decently.",
    },
    {
      id: "finance_savings",
      roundNumber: 2,
      prompt:
        "What is your approach to saving, investing, or preparing for financial surprises?",
      type: "text",
      category: "finance",
      answer:
        "I keep a small emergency fund and contribute regularly to retirement.",
    },
  ];

  const round1: QuestionRound = {
    roundNumber: 1,
    label: "Round 1: Foundations",
    source: "standard",
    questions: round1Questions,
  };

  const round2: QuestionRound = {
    roundNumber: 2,
    label: "Round 2: Tailored Questions",
    source: "prebuilt",
    questions: round2Questions,
  };

  return [round1, round2];
}

// ---------- Actual dev test component ----------

export const DevGeminiFutureTest: React.FC = () => {
  const [rawResponse, setRawResponse] = useState<string>("");
  const [parsedJson, setParsedJson] = useState<any | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [error, setError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  const handleRunTest = async () => {
    setError(null);
    setParsedJson(null);
    setRawResponse("");
    setStatus("Running...");

    if (!apiKey) {
      setError("Missing VITE_GEMINI_API_KEY in your environment.");
      setStatus("Error");
      return;
    }

    const config: ChatHandlerConfig = {
      apiKey,
      modelName: "gemini-2.5-flash",
      systemInstruction:
        "You are an assistant that infers plausible, grounded narratives about a person's future " +
        "based only on their self-reported answers to life questions. You never make supernatural or " +
        "guaranteed predictions. You talk in terms of trajectories, likely outcomes, and themes over " +
        "the next 10–20 years. You also estimate how positive and fulfilling this future is.",
    };

    const handler = new GeminiChatHandler(config);
    const rounds = buildFakeRounds();
    const transcript = buildRoundsTranscript(rounds);

    const prompt = `
You are helping generate a narrative "future" for a user based on a questionnaire.

Use ONLY the information in the questionnaire. Do NOT reveal the questions directly. 
Instead, infer themes, directions, and likely life trajectories over the next 10–20 years.
Avoid supernatural guarantees or exact dates. Speak in terms of tendencies, risks, and opportunities.

You must respond ONLY in JSON with this exact structure:

{
  "description": "a detailed multi-paragraph narrative about the person's future",
  "qualityScore": 0-100 number representing how positive/fulfilling the future is overall,
  "qualityLabel": "a short qualitative label like 'Challenging', 'Balanced', 'Strong Outlook'"
}

Here is the questionnaire data:

${transcript}
`;

    try {
      const text = await handler.sendMessage(prompt);
      setRawResponse(text);

      const parsed = extractJsonObjectFromText(text);
      setParsedJson(parsed);
      setStatus("Success");
    } catch (err: any) {
      console.error("Gemini test error:", err);
      setError(err?.message || String(err));
      setStatus("Error");
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Dev: Gemini Future Test</h1>
      <p>
        This page sends a fixed questionnaire transcript to Gemini and expects a JSON
        response with <code>description</code>, <code>qualityScore</code>, and{" "}
        <code>qualityLabel</code>.
      </p>

      <button
        type="button"
        onClick={handleRunTest}
        style={{ padding: "0.5rem 1rem", marginBottom: "1rem" }}
      >
        Run Gemini Test
      </button>

      <div style={{ marginBottom: "0.5rem" }}>
        <strong>Status:</strong> {status}
      </div>

      {error && (
        <div style={{ color: "#b00020", marginBottom: "1rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {parsedJson && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h2>Parsed JSON</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
{JSON.stringify(parsedJson, null, 2)}
          </pre>
        </div>
      )}

      {rawResponse && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h2>Raw Response</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
{rawResponse}
          </pre>
        </div>
      )}
    </div>
  );
};
