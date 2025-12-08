// src/lib/imageGeneratorHandler.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateImageFromFuture(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-image" });

  const response = await model.generateContent(prompt);

  for (const part of response.response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      return `data:image/png;base64,${imageData}`;
    }
  }

  throw new Error("Image data not found in response");
}
