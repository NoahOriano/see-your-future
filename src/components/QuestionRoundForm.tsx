// src/components/QuestionRoundForm.tsx
import React from "react";
import { QuestionRound } from "../types/future";
import { QuestionField } from "./QuestionField";

interface QuestionRoundFormProps {
  round: QuestionRound;
  disabled?: boolean;
  onChangeAnswer: (questionId: string, answer: string) => void;
  onSubmitRound: () => void;
}

export const QuestionRoundForm: React.FC<QuestionRoundFormProps> = ({
  round,
  disabled,
  onChangeAnswer,
  onSubmitRound,
}) => {
  const allAnswered = round.questions.every(
    (q) => (q.answer ?? "").trim().length > 0
  );

  return (
    <div>
      <h2 style={{ marginBottom: "0.25rem" }}>{round.label}</h2>
      <p style={{ marginTop: 0, color: "#555", marginBottom: "1rem" }}>
        Round {round.roundNumber} • Source: {round.source}
      </p>

      {round.questions.map((q) => (
        <QuestionField
          key={q.id}
          question={q}
          onChangeAnswer={onChangeAnswer}
        />
      ))}

      <button
        type="button"
        onClick={onSubmitRound}
        disabled={disabled || !allAnswered}
        style={{
          padding: "0.5rem 1.25rem",
          marginTop: "0.5rem",
          cursor: disabled || !allAnswered ? "not-allowed" : "pointer",
        }}
      >
        {disabled ? "Processing..." : "Continue"}
      </button>
    </div>
  );
};
