// src/lib/imageGeneratorHandler.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generate an image using a text prompt and an optional reference image
 * (e.g., "Make me look like a wizard" based on an uploaded photo).
 *
 * @param prompt        Text prompt describing the scene.
 * @param imageBase64   Base64 input image to use as context/reference.
 * @param imageMimeType MIME type of the input image (default "image/jpeg").
 *
 * @returns A data URL (`data:image/png;base64,...`) for the generated image.
 */
export async function generateImageFromContext(
  prompt: string,
  imageBase64?: string,
  imageMimeType: string = "image/jpeg"
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 1. Use the experimental model capable of Native Image Generation (Any-to-Any)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", 
    generationConfig: {
      // 2. CRITICAL: Tell the model to output an image, not text
      responseMimeType: "image/jpeg", 
      // specific syntax might vary by SDK version, 
      // but 'responseMimeType' or 'responseModalities' is usually the key.
    }
  });

  // 3. Prepare the payload (Prompt + Optional User Image)
  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    // Strip header if present to get pure base64 bytes
    const base64Data = imageBase64.includes(",") 
      ? imageBase64.split(",")[1] 
      : imageBase64;

    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: base64Data
      }
    });
  }

  try {
    // 4. Send the request
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const response = await result.response;
    
    // 5. Extract the image from the executable code or inline data
    // Gemini 2.0 often returns the image directly in the parts
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
       throw new Error("No candidates returned");
    }

    // Look for image data in the response parts
    for (const part of candidates[0].content.parts) {
       if (part.inlineData && part.inlineData.mimeType.startsWith("image")) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
       }
    }

    throw new Error("No image generated. The model might have returned text instead.");

  } catch (error) {
    console.error("Contextual generation failed:", error);
    throw error;
  }
}
