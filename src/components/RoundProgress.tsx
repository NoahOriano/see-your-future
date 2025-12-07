// src/components/RoundProgress.tsx
import React from "react";
import { QuestionRound } from "../types/future";

interface RoundProgressProps {
  rounds: QuestionRound[];
  currentRoundIndex: number;
}

export const RoundProgress: React.FC<RoundProgressProps> = ({
  rounds,
  currentRoundIndex,
}) => {
  if (rounds.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
        Step {currentRoundIndex + 1} of {rounds.length}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {rounds.map((round, idx) => {
          const isActive = idx === currentRoundIndex;
          const isCompleted = idx < currentRoundIndex;

          const bg = isActive ? "#007bff" : isCompleted ? "#28a745" : "#ccc";

          return (
            <div
              key={round.roundNumber}
              title={round.label}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                backgroundColor: bg,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
