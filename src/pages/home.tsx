// src/pages/home.tsx
import { GeminiChatHandler, ChatHandlerConfig } from "../lib/geminiChatHandler";
import SeeYourFutureApp from "../components/SeeYourFutureApp";

import {
  Question,
  QuestionRound,
  FutureResult,
  QuestionCategory,
  PrebuiltQuestionConfig,
} from "../types/future";
import {
  FutureEngineHandlers,
  NextRoundRequestContext,
  NextRoundResponse,
} from "../types/engine";

import prebuiltQuestionsJson from "../data/prebuiltQuestions.json";


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
  // Handles cases where the model wraps JSON in text or ```json ``` fences
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("No JSON object found in model response.");
  }
  const jsonStr = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}


// ---------- Helper functions for Round 2 selection ----------

function parseAgeFromRound1(round1: QuestionRound | undefined): number | null {
  if (!round1) return null;
  const ageQ = round1.questions.find((q) => q.id === "age");
  if (!ageQ || !ageQ.answer) return null;
  const n = parseInt(ageQ.answer, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractInterestsFromRound1(
  round1: QuestionRound | undefined
): Record<QuestionCategory, number> {
  const interests: Record<QuestionCategory, number> = {};
  if (!round1) return interests;

  for (const q of round1.questions) {
    if (q.type === "slider" && q.category) {
      const v = Number(q.answer ?? "0");
      const clamped = Math.max(0, Math.min(5, Number.isFinite(v) ? v : 0));
      interests[q.category] = clamped;
    }
  }

  return interests;
}

  const geminiConfig: ChatHandlerConfig = {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY, // make sure this is set
    modelName: "gemini-2.5-flash",
    systemInstruction:
      "You are an assistant that infers plausible, grounded narratives about a person's future " +
      "based only on their self-reported answers to life questions. You never make supernatural or " +
      "guaranteed predictions. You talk in terms of trajectories, likely outcomes, and themes over " +
      "the next 10–20 years. You also estimate how positive and fulfilling this future is.",
  };

  const geminiHandler = new GeminiChatHandler(geminiConfig);


function scorePrebuiltQuestion(
  q: PrebuiltQuestionConfig,
  interests: Record<QuestionCategory, number>,
  age: number | null
): number {
  // Hard age limits
  if (typeof q.ageMin === "number" && age !== null && age < q.ageMin) {
    return -Infinity;
  }
  if (typeof q.ageMax === "number" && age !== null && age > q.ageMax) {
    return -Infinity;
  }

  const ratings = q.categoryRatings ?? {};
  let score = 0;

  for (const [cat, rating] of Object.entries(ratings)) {
    const interest = interests[cat] ?? 0;
    score += rating * interest;
  }

  return score;
}

function selectBestPrebuiltQuestions(
  allPrebuilt: PrebuiltQuestionConfig[],
  age: number | null,
  interests: Record<QuestionCategory, number>,
  limit = 10
): PrebuiltQuestionConfig[] {
  const scored = allPrebuilt.map((q) => ({
    question: q,
    score: scorePrebuiltQuestion(q, interests, age),
  }));

  const valid = scored.filter((s) => s.score !== -Infinity);
  valid.sort((a, b) => b.score - a.score);

  return valid.slice(0, limit).map((s) => s.question);
}

// ---------------------- Home Component ----------------------

export default function Home() {
  // Round 1: inline, generic, no future hints.
  const standardRound1Questions: Question[] = [
    {
      id: "age",
      roundNumber: 1,
      prompt: "How old are you? (Number only)",
      type: "text",
    },
    {
      id: "primary_goal",
      roundNumber: 1,
      prompt: "What is your primary focus or desire for the next 10 years?",
      type: "text",
    },
    // Interest sliders (0–5) per category:
    {
      id: "interest_career",
      roundNumber: 1,
      prompt: "How interested are you in shaping your work or career path?",
      type: "slider",
      category: "career",
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
    },
    {
      id: "interest_health",
      roundNumber: 1,
      prompt: "How important is your long-term physical and mental health to you?",
      type: "slider",
      category: "health",
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
    },
    {
      id: "interest_relationships",
      roundNumber: 1,
      prompt: "How much priority do you place on relationships and community?",
      type: "slider",
      category: "relationships",
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
    },
    {
      id: "interest_finance",
      roundNumber: 1,
      prompt: "How focused are you on your financial future and stability?",
      type: "slider",
      category: "finance",
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
    },
    {
      id: "interest_personal",
      roundNumber: 1,
      prompt:
        "How strongly are you drawn to personal growth, identity, and meaning?",
      type: "slider",
      category: "personal",
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
    },
  ];

// Raw prebuilt questions from JSON (no round numbers here)
const prebuiltQuestionBank: PrebuiltQuestionConfig[] =
  prebuiltQuestionsJson as unknown as PrebuiltQuestionConfig[];

  const engineHandlers: FutureEngineHandlers = {
    async requestNextRound(
      context: NextRoundRequestContext
    ): Promise<NextRoundResponse> {
      const { requestedRoundNumber, previousRounds } = context;

      // ---------- Round 2: ONLY round using imported questions ----------
      if (requestedRoundNumber === 2) {
        const round1 = previousRounds.find((r) => r.roundNumber === 1);
        const age = parseAgeFromRound1(round1);
        const interests = extractInterestsFromRound1(round1);

        const bestConfigs = selectBestPrebuiltQuestions(
          prebuiltQuestionBank,
          age,
          interests,
          10
        );

        // Wrap configs into actual Questions for this specific round
        const roundQuestions: Question[] = bestConfigs.map((cfg) => ({
          ...cfg,
          roundNumber: 2,
        }));

        const round: QuestionRound = {
          roundNumber: 2,
          label: "Round 2: Tailored Questions",
          source: "prebuilt",
          questions: roundQuestions,
        };

        return { round };
      }

      // ---------- Round 3+ : generated questions only ----------
      if (requestedRoundNumber === 3) {
        const lastRound =
          previousRounds.length > 0
            ? previousRounds[previousRounds.length - 1]
            : undefined;

        const snippet = lastRound?.questions[0]?.answer?.slice(0, 40) ?? "";

        const generatedQuestions: Question[] = [
          {
            id: "future_doubts",
            roundNumber: 3,
            prompt: `What concerns do you have about moving toward "${snippet}..."?`,
            type: "text",
            category: "personal",
          },
          {
            id: "support_network",
            roundNumber: 3,
            prompt:
              "How strong is your current support network (friends, family, mentors)?",
            type: "select",
            category: "relationships",
            options: ["Weak", "Average", "Strong"],
          },
        ];

        const round: QuestionRound = {
          roundNumber: 3,
          label: "Round 3: Deeper Reflections",
          source: "generated",
          questions: generatedQuestions,
        };

        return { round };
      }

      // Past Round 3 → no more rounds; generate the final future
      return { round: null };
    },

    async generateFutureResult(rounds: QuestionRound[]): Promise<FutureResult> {
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

      let rawText: string;
      try {
        rawText = await geminiHandler.sendMessage(prompt);
      } catch (e: any) {
        console.error("Gemini error:", e);
        // Fallback simple description
        return {
          description:
            "We were unable to generate a detailed future description at this time, " +
            "but your answers suggest a future shaped by your current priorities and interests.",
          qualityScore: 70,
          qualityLabel: "Unknown (Fallback)",
        };
      }

      try {
        const parsed = extractJsonObjectFromText(rawText);

        const description =
          typeof parsed.description === "string" && parsed.description.trim()
            ? parsed.description
            : rawText;

        const scoreNum = Number(parsed.qualityScore);
        const qualityScore =
          Number.isFinite(scoreNum) && scoreNum >= 0 && scoreNum <= 100
            ? scoreNum
            : 75;

        const qualityLabel =
          typeof parsed.qualityLabel === "string" && parsed.qualityLabel.trim()
            ? parsed.qualityLabel
            : "Inferred";

        return {
          description,
          qualityScore,
          qualityLabel,
        };
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", e, rawText);

        // If parsing fails, just use the whole response as the description
        return {
          description: rawText,
          qualityScore: 75,
          qualityLabel: "Unstructured Response",
        };
      }
    },
  };

  return (
    <div className="home-page">
      <h1>See Your Future</h1>

      <p>
        This tool starts with a neutral round of questions (who you are and
        what you care about), then selects a single tailored round of
        prebuilt questions based on your age and interests, and finally uses
        generated questions to go deeper before producing your future
        description and quality score.
      </p>

      <h2>How to Use the Application</h2>
      <ul>
        <li>Answer Round 1 (age, focus, and interest sliders) honestly.</li>
        <li>Round 2 is auto-selected from a bank of questions that fit you.</li>
        <li>Later questions are generated dynamically based on your answers.</li>
        <li>Review the final narrative and quality score.</li>
      </ul>

      <div className="app-container" style={{ marginTop: "2rem" }}>
        <SeeYourFutureApp
          standardRound1Questions={standardRound1Questions}
          engineHandlers={engineHandlers}
          autoRequestNextRound={true}
        />
      </div>
    </div>
  );
}
