// src/components/FutureResultView.tsx
import React, { useEffect, useState } from "react";
import { FutureResult } from "../types/future";
import { generateImageFromFuture } from "../lib/imageGeneratorHandler";
import { generateImagePrompt } from "../lib/prompts";
import { GeminiChatHandler } from "../lib/geminiChatHandler";

interface FutureResultViewProps {
  result: FutureResult | null;
  onReset?: () => void;
}

export const FutureResultView: React.FC<FutureResultViewProps> = ({
  result,
  onReset,
}) => {
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.description) {
      const handleGenerateImagePrompt = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          return;
        }
        const handler = new GeminiChatHandler({ apiKey });
        const prompt = generateImagePrompt(result.description);
        const generatedPrompt = await handler.sendMessage(prompt);
        setImagePrompt(generatedPrompt);
      };
      handleGenerateImagePrompt();
    }
  }, [result]);

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setImgError(null);
    setImgLoading(true);
    try {
      const url = await generateImageFromFuture(imagePrompt);
      setImageUrl(url);
    } catch (e: unknown) {
      setImgError(e instanceof Error ? e.message : String(e));
    } finally {
      setImgLoading(false);
    }
  };

  if (!result) return null;

  const { description, qualityScore, qualityLabel } = result;

  return (
    <section>
      <h2>Your Future</h2>

      <div>
        <div>
          <strong>Quality Score:</strong> {qualityScore.toFixed(1)}
          {qualityLabel ? ` (${qualityLabel})` : null}
        </div>
      </div>

      <div>
        {description}
      </div>

      {imagePrompt && (
        <div>
          <h3>Image Prompt</h3>
          <p>{imagePrompt}</p>
          <button onClick={handleGenerateImage} disabled={imgLoading}>
            {imgLoading ? "Generating Image..." : "Generate Image"}
          </button>
        </div>
      )}

      {imgLoading && <p>Generating image...</p>}
      {imgError && <p>Error generating image: {imgError}</p>}
      {imageUrl && (
        <div>
          <img
            src={imageUrl}
            alt="Generated future"
          />
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
    </section>
  );
};
