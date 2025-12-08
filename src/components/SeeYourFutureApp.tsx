// src/components/SeeYourFutureApp.tsx
import React, { useCallback, useEffect, useState } from "react";
import { FutureResult, Question, QuestionRound } from "../types/future";
import {
  FutureEngineHandlers,
  NextRoundRequestContext,
} from "../types/engine";
import { QuestionRoundForm } from "./QuestionRoundForm";
import { RoundProgress } from "./RoundProgress";
import { FutureResultView } from "./FutureResultView";

interface SeeYourFutureAppProps {
  /**
   * Standard Round 1 questions (always present).
   * Example: demographics, basic goals, etc.
   */
  standardRound1Questions: Question[];

  /**
   * Handlers that wrap your shared LLM API "chat" logic.
   */
  engineHandlers: FutureEngineHandlers;

  /**
   * Optional: auto-trigger Round 2 immediately after Round 1.
   * If false, you could add a manual "Generate Future" after Round 1.
   */
  autoRequestNextRound?: boolean;
}

export const SeeYourFutureApp: React.FC<SeeYourFutureAppProps> = ({
  standardRound1Questions,
  engineHandlers,
  autoRequestNextRound = true,
}) => {
  const [rounds, setRounds] = useState<QuestionRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FutureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);

  // Initialize Round 1 on mount
  useEffect(() => {
    const round1: QuestionRound = {
      roundNumber: 1,
      label: "Round 1: Foundations",
      source: "standard",
      questions: standardRound1Questions.map((q) => ({
        ...q,
        roundNumber: 1,
      })),
    };
    setRounds([round1]);
    setCurrentRoundIndex(0);
    setResult(null);
    setError(null);
  }, [standardRound1Questions]);

  const currentRound = rounds[currentRoundIndex];

  const updateAnswer = useCallback(
    (questionId: string, answer: string) => {
      setRounds((prev) =>
        prev.map((round) => ({
          ...round,
          questions: round.questions.map((q) =>
            q.id === questionId ? { ...q, answer } : q
          ),
        }))
      );
    },
    [setRounds]
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRound = useCallback(async () => {
    if (!currentRound) return;

    setError(null);

    // Basic validation (optional – you already prevent in UI)
    const unanswered = currentRound.questions.filter(
      (q) => (q.answer ?? "").trim().length === 0
    );
    if (unanswered.length > 0) {
      setError("Please answer all questions before continuing.");
      return;
    }

    // If we already have a result, this button should probably generate a new flow
    if (result) {
      return;
    }

    // Decide whether to request the next round or generate the future.
    const nextRoundNumber = currentRound.roundNumber + 1;

    // For demo: always try to get the next round; if the handler returns null,
    // then we generate the result.
    setIsLoading(true);

    try {
      const context: NextRoundRequestContext = {
        previousRounds: rounds,
        requestedRoundNumber: nextRoundNumber,
      };

      const nextRoundResponse = await engineHandlers.requestNextRound(context);

      if (nextRoundResponse.round) {
        // Append the new round (Round 2 or Round N)
        setRounds((prev) => [...prev, nextRoundResponse.round!]);

        if (autoRequestNextRound) {
          setCurrentRoundIndex((prevIdx) => prevIdx + 1);
        }
      } else {
        // No more rounds; generate final future
        const future = await engineHandlers.generateFutureResult(rounds, imageBase64, imageMimeType);
        setResult(future);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Something went wrong while processing.");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentRound,
    result,
    rounds,
    engineHandlers,
    autoRequestNextRound,
    imageBase64,
    imageMimeType,
  ]);

  const handleGenerateFutureNow = useCallback(async () => {
    if (!rounds.length) return;
    setIsLoading(true);
    setError(null);
    try {
      const future = await engineHandlers.generateFutureResult(rounds, imageBase64, imageMimeType);
      setResult(future);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to generate your future.");
    } finally {
      setIsLoading(false);
    }
  }, [rounds, engineHandlers, imageBase64, imageMimeType]);

  const handleReset = useCallback(() => {
    // Reset to initial state; caller can also control via props rebuild
    setRounds((prev) => {
      if (!prev.length) return prev;
      const round1 = prev[0];
      return [
        {
          ...round1,
          questions: round1.questions.map((q) => ({
            ...q,
            answer: "",
          })),
        },
      ];
    });
    setCurrentRoundIndex(0);
    setResult(null);
    setError(null);
    setImageBase64(null);
    setImageMimeType(null);
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1>See Your Future</h1>
        <p style={{ color: "#555", marginTop: "0.5rem" }}>
          Answer a series of questions across multiple rounds. Based on your
          responses, we’ll generate a narrative of your future and a separate
          quality score for your outcome.
        </p>
      </header>

      <div>
        <h3>Upload an image of yourself! (optional)</h3>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {rounds.length > 0 && (
        <>
          <RoundProgress
            rounds={rounds}
            currentRoundIndex={currentRoundIndex}
          />

          {currentRound && !result && (
            <QuestionRoundForm
              round={currentRound}
              disabled={isLoading}
              onChangeAnswer={updateAnswer}
              onSubmitRound={handleSubmitRound}
            />
          )}

          {!result && rounds.length >= 1 && (
            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={handleGenerateFutureNow}
                disabled={isLoading}
                style={{ padding: "0.5rem 1rem" }}
              >
                {isLoading ? "Generating..." : "Generate Future Now"}
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div
          style={{
            marginTop: "1rem",
            color: "#b00020",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <FutureResultView result={result} onReset={handleReset} imageBase64={imageBase64} imageMimeType={imageMimeType} />
    </div>
  );
};

export default SeeYourFutureApp;
