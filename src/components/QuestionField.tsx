// src/components/QuestionField.tsx
import React from "react";
import { Question } from "../types/future";

interface QuestionFieldProps {
  question: Question;
  onChangeAnswer: (questionId: string, answer: string) => void;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({
  question,
  onChangeAnswer,
}) => {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    onChangeAnswer(question.id, e.target.value);
  };

  const sliderMin = question.sliderMin ?? 0;
  const sliderMax = question.sliderMax ?? 5;
  const sliderStep = question.sliderStep ?? 1;
  const sliderValue = question.answer ?? String(sliderMin);

  return (
    <div style={{ marginBottom: "1rem", textAlign: "left" }}>
      <label
        htmlFor={question.id}
        style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}
      >
        {question.prompt}
        {question.category && (
          <span style={{ fontSize: "0.85rem", fontWeight: 400, marginLeft: 8 }}>
            ({question.category})
          </span>
        )}
      </label>

      {question.type === "select" && question.options ? (
        <select
          id={question.id}
          value={question.answer ?? ""}
          onChange={handleChange}
          style={{ width: "100%", padding: "0.5rem" }}
        >
          <option value="">Select an option...</option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : question.type === "slider" ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <input
            id={question.id}
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={sliderValue}
            onChange={handleChange}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 24, textAlign: "right" }}>{sliderValue}</span>
        </div>
      ) : (
        <textarea
          id={question.id}
          value={question.answer ?? ""}
          onChange={handleChange}
          rows={3}
          style={{ width: "100%", padding: "0.5rem", resize: "vertical" }}
        />
      )}
    </div>
  );
};
