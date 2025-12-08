// src/components/FutureResultView.tsx
import React, { useState } from "react";
import { FutureResult } from "../types/future";
import { generateImageFromFuture } from "../lib/imageGeneratorHandler";

interface FutureResultViewProps {
  result: FutureResult | null;
  onReset?: () => void;
}

export const FutureResultView: React.FC<FutureResultViewProps> = ({
  result,
  onReset,
}) => {
  if (!result) return null;

  const { description, qualityScore, qualityLabel } = result;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    setImgError(null);
    setImgLoading(true);
    try {
      const url = await generateImageFromFuture(description);
      setImageUrl(url);
    } catch (e: any) {
      setImgError(e?.message ?? String(e));
    } finally {
      setImgLoading(false);
    }
  };

  return (
    <section style={{ marginTop: "2rem", textAlign: "left" }}>
      <h2>Your Future</h2>

      <div
        style={{
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: "1rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {description}
      </div>

      <div
        style={{
          padding: "0.75rem 1rem",
          borderRadius: 8,
          background: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>Quality Score:</strong> {qualityScore.toFixed(1)}
          {qualityLabel ? ` (${qualityLabel})` : null}
        </div>

        <div
          style={{
            flex: 1,
            maxWidth: 250,
            height: 8,
            borderRadius: 999,
            backgroundColor: "#e1e1e1",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, qualityScore))}%`,
              height: "100%",
              backgroundColor: "#28a745",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          Start Over
        </button>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button
          type="button"
          onClick={handleGenerateImage}
          disabled={imgLoading}
          style={{ padding: "0.5rem 1rem", marginRight: 10 }}
        >
          {imgLoading ? "Generating image..." : "Generate Image"}
        </button>
        {imgError && (
          <span style={{ color: "#b00020", marginLeft: 8 }}>{imgError}</span>
        )}
      </div>

      {imageUrl && (
        <div style={{ marginTop: 12 }}>
          <img
            src={imageUrl}
            alt="Generated future"
            style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #ddd" }}
          />
        </div>
      )}
    </section>
  );
};
