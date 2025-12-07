// src/types/future.ts

export type QuestionInputType = "text" | "select" | "slider";

export type QuestionCategory =
  | "career"
  | "health"
  | "relationships"
  | "finance"
  | "personal"
  | string;
// src/types/future.ts

export interface Question {
  id: string;
  roundNumber: number;
  prompt: string;
  type: QuestionInputType;
  category?: QuestionCategory;
  options?: string[];
  answer?: string;

  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;

  ageMin?: number;
  ageMax?: number;

  // CHANGED: allow some categories to be missing
  categoryRatings?: Partial<Record<QuestionCategory, number>>;

  meta?: Record<string, unknown>;
}

// Raw config for prebuilt questions (JSON)
export interface PrebuiltQuestionConfig {
  id: string;
  prompt: string;
  type: QuestionInputType;
  category?: QuestionCategory;
  ageMin?: number;
  ageMax?: number;

  // CHANGED: same here
  categoryRatings?: Partial<Record<QuestionCategory, number>>;
}


export type RoundSource = "standard" | "prebuilt" | "generated";

export interface QuestionRound {
  roundNumber: number;
  label: string;
  source: RoundSource;
  questions: Question[];
}

export interface FutureResult {
  description: string;
  qualityScore: number;
  qualityLabel?: string;
}
