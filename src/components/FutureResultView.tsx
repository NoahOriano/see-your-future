// src/components/FutureResultView.tsx
import React, { useEffect, useState } from "react";
import { FutureResult } from "../types/future";
import { generateImageFromContext } from "../lib/imageGeneratorHandler";
import { generateImagePrompt } from "../lib/prompts";
import { GeminiChatHandler } from "../lib/geminiChatHandler";
import { generateTTS } from "../lib/elevenLabsTTSHandler";

interface FutureResultViewProps {
  result: FutureResult | null;
  onReset?: () => void;
  imageBase64?: string;
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

  const [ttsBase64, setTtsBase64] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  useEffect(() => {
    if (!result?.description) return;

    const generate = async () => {
      setTtsLoading(true);
      setTtsError(null);

      try {
        const audio = await generateTTS(result.description, "21m00Tcm4TlvDq8ikWAM");
        setTtsBase64(audio);
      } catch (err: any) {
        setTtsError(err.message);
      } finally {
        setTtsLoading(false);
      }
    };

    generate();
  }, [result]);

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

      <div>{description}</div>

      {/* --- TTS Section --- */}
      <div style={{ marginTop: "1rem" }}>
        {ttsLoading && <p>Generating voice...</p>}
        {ttsError && <p style={{ color: "red" }}>TTS error: {ttsError}</p>}

        {ttsBase64 && (
          <audio controls>
            <source
              src={`data:audio/mpeg;base64,${ttsBase64}`}
              type="audio/mpeg"
            />
          </audio>
        )}
      </div>

      {/* --- Image Section --- */}
      {imgLoading && <p>Generating image...</p>}
      {imgError && <p>Error generating image: {imgError}</p>}
      {imageUrl && (
        <div>
          <img src={imageUrl} alt="Generated future" />
          {imagePrompt && <p>{imagePrompt}</p>}
        </div>
      )}

      {onReset && (
        <button type="button" onClick={onReset}>
          Start Over
        </button>
      )}
    </section>
  );
};