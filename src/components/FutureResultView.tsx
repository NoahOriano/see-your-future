// src/components/FutureResultView.tsx
import React, { useEffect, useState } from "react";
import { FutureResult } from "../types/future";
import { generateImageFromContext } from "../lib/imageGeneratorHandler";
import { generateImagePrompt } from "../lib/prompts";
import { GeminiChatHandler } from "../lib/geminiChatHandler";

interface FutureResultViewProps {
  result: FutureResult | null;
  onReset?: () => void;
  imageBase64?: string | null;
  imageMimeType?: string | null;
}

export const FutureResultView: React.FC<FutureResultViewProps> = ({
  result,
  onReset,
  imageBase64,
  imageMimeType,
}) => {
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // 🔊 NEW: Voice state
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // 🔊 NEW: Generate + play voice
  const handleGenerateVoice = async () => {
    setVoiceError(null);
    setVoiceLoading(true);

    try {
      const res = await fetch("/api/generate-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });

      if (!res.ok) {
        throw new Error(`Voice API Error: ${res.status}`);
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error("Server did not return audioBase64");
      }

      // Create a playable audio object
      const audio = new Audio("data:audio/mpeg;base64," + data.audioBase64);
      audio.play();
    } catch (e: any) {
      setVoiceError(e?.message ?? String(e));
    } finally {
      setVoiceLoading(false);
    }
  };

  useEffect(() => {
    if (result?.description) {
      const handleGenerateImage = async (prompt: string) => {
        setImgError(null);
        setImgLoading(true);
        try {
          const url = await generateImageFromContext(prompt, imageBase64, imageMimeType ?? "image/jpeg");
          setImageUrl(url);
        } catch (e: unknown) {
          setImgError(e instanceof Error ? e.message : String(e));
        } finally {
          setImgLoading(false);
        }
      };

      const handleGenerateImagePrompt = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          return;
        }
        const handler = new GeminiChatHandler({ apiKey });
        const prompt = generateImagePrompt(result.description);
        const generatedPrompt = await handler.sendMessage(prompt);
        setImagePrompt(generatedPrompt);
        handleGenerateImage(generatedPrompt);
      };
      handleGenerateImagePrompt();
    }
  }, [result, imageBase64, imageMimeType]);

  if (!result) return null;

  const { description, qualityScore, qualityLabel } = result;

  return (
    <section>
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
      <div>
        <div>
          <strong>Quality Score:</strong> {qualityScore.toFixed(1)}
          {qualityLabel ? ` (${qualityLabel})` : null}
        </div>
      </div>

      <div>
        {description}
      </div>

      {imgLoading && <p>Generating image...</p>}
      {imgError && <p>Error generating image: {imgError}</p>}
      {imageUrl && (
        <div>
          <img
            src={imageUrl}
            alt="Generated future"
          />
          {imagePrompt && <p>{imagePrompt}</p>}
        </div>
      )}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
        >
          Start Over
        </button>
      )}

      <div style={{ marginTop: "1rem" }}>
        {/* 🎨 IMAGE BUTTON */}
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

        {/* 🔊 NEW — VOICE BUTTON */}
        <button
          type="button"
          onClick={handleGenerateVoice}
          disabled={voiceLoading}
          style={{ padding: "0.5rem 1rem", marginRight: 10 }}
        >
          {voiceLoading ? "Generating voice..." : "Play Voice"}
        </button>
        {voiceError && (
          <span style={{ color: "#b00020", marginLeft: 8 }}>{voiceError}</span>
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
