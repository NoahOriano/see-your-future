// src/types/engine.ts

import { FutureResult, QuestionRound } from "./future";

export interface NextRoundRequestContext {
  previousRounds: QuestionRound[];
  requestedRoundNumber: number;
}

export interface NextRoundResponse {
  round: QuestionRound | null; // null => no more rounds
}

export interface FutureEngineHandlers {
  /**
   * Called when the user completes a round and wants to proceed
   * to the next round of questions (Round 2, 3, ...).
   */
  requestNextRound: (
    context: NextRoundRequestContext
  ) => Promise<NextRoundResponse>;

  /**
   * Called when the user is done answering questions and wants to
   * generate the future description + quality score.
   */
  generateFutureResult: (
    rounds: QuestionRound[],
    imageBase64?: string | null,
    imageMimeType?: string | null
  ) => Promise<FutureResult>;
}
