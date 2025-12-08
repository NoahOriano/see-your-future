// src/dev/DevGeminiFutureTest.tsx

import React, { useState, useEffect } from "react";
import {
  Question,
  QuestionRound,
  QuestionCategory,
  FutureResult,
} from "../types/future";

// Import the image
import myselfImage from "./Myself.jpg";

// ---------- Helper functions ----------

// Convert image URL to base64
async function loadImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64 = result.split(',')[1];
      const mimeType = blob.type || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---------- Fake data to simulate your rounds ----------

function buildFakeRounds(): QuestionRound[] {
  const round1Questions: Question[] = [
    {
      id: "age",
      roundNumber: 1,
      prompt: "How old are you? (Number only)",
      type: "text",
      answer: "24",
    },
    {
      id: "primary_goal",
      roundNumber: 1,
      prompt: "What is your primary focus or desire for the next 10 years?",
      type: "text",
      answer:
        "Build a meaningful career in software while maintaining good health and relationships.",
    },
    {
      id: "interest_career",
      roundNumber: 1,
      prompt: "How interested are you in shaping your work or career path?",
      type: "slider",
      category: "career" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "5",
    },
    {
      id: "interest_health",
      roundNumber: 1,
      prompt:
        "How important is your long-term physical and mental health to you?",
      type: "slider",
      category: "health" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "4",
    },
    {
      id: "interest_relationships",
      roundNumber: 1,
      prompt: "How much priority do you place on relationships and community?",
      type: "slider",
      category: "relationships" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "3",
    },
    {
      id: "interest_finance",
      roundNumber: 1,
      prompt: "How focused are you on your financial future and stability?",
      type: "slider",
      category: "finance" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "4",
    },
    {
      id: "interest_personal",
      roundNumber: 1,
      prompt:
        "How strongly are you drawn to personal growth, identity, and meaning?",
      type: "slider",
      category: "personal" as QuestionCategory,
      sliderMin: 0,
      sliderMax: 5,
      sliderStep: 1,
      answer: "5",
    },
  ];

  const round2Questions: Question[] = [
    {
      id: "career_growth",
      roundNumber: 2,
      prompt:
        "How important is long-term growth and advancement in your work or career?",
      type: "text",
      category: "career",
      answer:
        "Very important, I want to keep learning and taking on more responsibility.",
    },
    {
      id: "health_routine",
      roundNumber: 2,
      prompt:
        "Describe your current routine for sleep, exercise, and nutrition.",
      type: "text",
      category: "health",
      answer:
        "I sleep 7 hours, exercise moderately 3 times a week, and try to eat decently.",
    },
    {
      id: "finance_savings",
      roundNumber: 2,
      prompt:
        "What is your approach to saving, investing, or preparing for financial surprises?",
      type: "text",
      category: "finance",
      answer:
        "I keep a small emergency fund and contribute regularly to retirement.",
    },
  ];

  const round1: QuestionRound = {
    roundNumber: 1,
    label: "Round 1: Foundations",
    source: "standard",
    questions: round1Questions,
  };

  const round2: QuestionRound = {
    roundNumber: 2,
    label: "Round 2: Tailored Questions",
    source: "prebuilt",
    questions: round2Questions,
  };

  return [round1, round2];
}

// ---------- Actual dev test component ----------

export const DevGeminiFutureTest: React.FC = () => {
  const [status, setStatus] = useState<string>("Idle");
  const [error, setError] = useState<string | null>(null);
  
  // Image state
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  
  // Future result state
  const [futureResult, setFutureResult] = useState<FutureResult | null>(null);
  
  // Generated image state
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Load the image on mount
  useEffect(() => {
    const loadImage = async () => {
      try {
        const { base64, mimeType } = await loadImageAsBase64(myselfImage);
        setImageBase64(base64);
        setImageMimeType(mimeType);
      } catch (err) {
        console.error("Failed to load image:", err);
        setError("Failed to load Myself.jpg image");
      }
    };
    loadImage();
  }, []);

  const handleGenerateFuture = async () => {
    setError(null);
    setFutureResult(null);
    setGeneratedImageUrl(null);
    setImageDescription(null);
    setStatus("Running...");

    if (!imageBase64 || !imageMimeType) {
      setError("Image not loaded yet. Please wait.");
      setStatus("Error");
      return;
    }

    try {
      // Step 1: Describe the image
      setStatus("Describing image...");
      const describeResponse = await fetch("/api/describe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, imageMimeType }),
      });

      if (!describeResponse.ok) {
        const errorData = await describeResponse.json();
        throw new Error(errorData.error || "Failed to describe image");
      }

      const describeData = await describeResponse.json();
      setImageDescription(describeData.description);

      // Step 2: Generate future with image
      setStatus("Generating future...");
      const rounds = buildFakeRounds();
      
      const futureResponse = await fetch("/api/generate-future", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rounds, 
          imageBase64, 
          imageMimeType,
          imageDescription: describeData.description 
        }),
      });

      if (!futureResponse.ok) {
        const errorData = await futureResponse.json();
        throw new Error(errorData.error || "Failed to generate future");
      }

      const futureData = await futureResponse.json();
      setFutureResult({
        description: futureData.description,
        qualityScore: futureData.qualityScore,
        qualityLabel: futureData.qualityLabel,
      });

      setStatus("Success");
    } catch (err: unknown) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Error");
    }
  };

  const handleGenerateImage = async () => {
    if (!futureResult) return;

    setImageError(null);
    setImageGenerating(true);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: futureResult.description,
          imageBase64,
          imageMimeType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImageUrl(data.url);
    } catch (err: unknown) {
      console.error("Image generation error:", err);
      setImageError(err instanceof Error ? err.message : String(err));
    } finally {
      setImageGenerating(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Dev: Future Generation Test</h1>
      <p>
        This page loads the <code>Myself.jpg</code> image, generates a future description
        based on fake questionnaire data and the image, and displays the result with an
        optional generated image.
      </p>

      {/* Display the loaded image */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Loaded Image:</h3>
        <img 
          src={myselfImage} 
          alt="Myself" 
          style={{ 
            maxWidth: "300px", 
            borderRadius: 8, 
            border: "1px solid #ddd" 
          }} 
        />
        {imageBase64 && (
          <p style={{ color: "#28a745", marginTop: "0.5rem" }}>
            ✓ Image loaded successfully ({imageMimeType})
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleGenerateFuture}
        disabled={!imageBase64 || status === "Running..."}
        style={{ 
          padding: "0.5rem 1rem", 
          marginBottom: "1rem",
          cursor: !imageBase64 || status === "Running..." ? "not-allowed" : "pointer"
        }}
      >
        {status === "Running..." ? "Generating..." : "Generate Future"}
      </button>

      <div style={{ marginBottom: "0.5rem" }}>
        <strong>Status:</strong> {status}
      </div>

      {error && (
        <div style={{ color: "#b00020", marginBottom: "1rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {imageDescription && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#f8f9fa",
          }}
        >
          <h3>Image Description:</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{imageDescription}</p>
        </div>
      )}

      {futureResult && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h2>Your Future</h2>
          <div
            style={{
              padding: "1rem",
              border: "1px solid #eee",
              borderRadius: 8,
              marginBottom: "1rem",
              whiteSpace: "pre-wrap",
              background: "#fafafa",
            }}
          >
            {futureResult.description}
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
              <strong>Quality Score:</strong> {futureResult.qualityScore.toFixed(1)}
              {futureResult.qualityLabel ? ` (${futureResult.qualityLabel})` : null}
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
                  width: `${Math.max(0, Math.min(100, futureResult.qualityScore))}%`,
                  height: "100%",
                  backgroundColor: "#28a745",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={imageGenerating}
              style={{ padding: "0.5rem 1rem", marginRight: 10 }}
            >
              {imageGenerating ? "Generating image..." : "Generate Future Image"}
            </button>
            {imageError && (
              <span style={{ color: "#b00020", marginLeft: 8 }}>{imageError}</span>
            )}
          </div>

          {generatedImageUrl && (
            <div style={{ marginTop: "1rem" }}>
              <h3>Generated Future Image:</h3>
              <img
                src={generatedImageUrl}
                alt="Generated future"
                style={{ 
                  maxWidth: "100%", 
                  borderRadius: 8, 
                  border: "1px solid #ddd" 
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
