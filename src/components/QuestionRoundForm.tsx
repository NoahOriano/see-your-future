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

  const isFreeformRound =
    round.questions.length === 1 && round.questions[0].type === "freeform";

  return (
    <div className="form-wrapper">
      <h2 style={{ marginBottom: "0.25rem" }}>{round.label}</h2>
      <p style={{ marginTop: 0, color: "#555", marginBottom: "1rem" }}>
        Round {round.roundNumber} • Source: {round.source}
      </p>

      {isFreeformRound ? (
        <textarea
          value={round.questions[0].answer ?? round.questions[0].prompt}
          onChange={(e) =>
            onChangeAnswer(round.questions[0].id, e.target.value)
          }
          rows={10}
          style={{ width: "100%", padding: "0.5rem", resize: "vertical" }}
          disabled={disabled}
        />
      ) : (
        round.questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            onChangeAnswer={onChangeAnswer}
          />
        ))
      )}

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
