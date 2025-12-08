// api/generate-image.ts
// Vercel-style serverless function that proxies image generation requests to
// an external image API using a server-only environment variable.
//
// Request body shape (JSON):
// {
//   prompt: string;                 // future description text
//   imageDescription?: string | null; // optional text description of the uploaded image
//   imageBase64?: string | null;    // optional base64-encoded reference image
//   imageMimeType?: string | null;  // mime type of the reference image
// }
//
// Pipeline:
// 1) Use the future description + optional imageDescription to build an
//    instruction prompt via generateImagePrompt.
// 2) (Intermediate text generation) Use Gemini (if configured) to turn that
//    into a short, vivid image-generation prompt.
// 3) Pass ONLY that short prompt, plus the optional reference image, to the
//    actual image provider (OpenAI Images API or Gemini multimodal when
//    IMAGE_PROVIDER=google).

// Use Gemini server-side SDK for image generation when provider=google so we can
// feed both the future description and the reference image as inline data.
import { GoogleGenerativeAI } from "@google/generative-ai";
// Import server-side image prompt helper so we can build an instruction
// prompt for the intermediate text generation step.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { generateImagePrompt } from "./prompts.js";
// Use the server-side Gemini chat handler for the intermediate text-to-text
// step that produces a short image prompt from the future description.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { GeminiChatHandler } from "./geminiChatHandler.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt, imageDescription, imageBase64, imageMimeType } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing 'prompt' in request body" });
    return;
  }

  // ---- 1) Build instruction prompt for image-prompt generation ----

  const referenceDescription =
    typeof imageDescription === "string" && imageDescription.trim().length > 0
      ? imageDescription.trim()
      : "(no separate image description provided)";

  const combinedDescription =
    "The subject of this image is the same person as in the following reference photo description.\n\n" +
    "Reference photo description (who the person is and what they look like):\n" +
    referenceDescription +
    "\n\n" +
    "Now depict this same person inside the following realistic future life scenario. " +
    "The person in the image must clearly be the same individual in age, body type, skin tone, hair, and general style, " +
    "but shown within this future: \n" +
    prompt;

  // This is the instruction we give to Gemini to ask for a short image prompt.
  const imagePromptInstruction = generateImagePrompt(combinedDescription);

  // ---- 2) Intermediate text generation: future -> short image prompt ----

  let finalPrompt: string = imagePromptInstruction;
  const geminiTextKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiTextKey) {
    try {
      const chat = new GeminiChatHandler({
        apiKey: geminiTextKey,
        modelName: "gemini-2.5-flash",
      });
      // Ask Gemini to return just the short image prompt text.
      finalPrompt = await chat.sendMessage(imagePromptInstruction);
    } catch (e: any) {
      // Fall back to the instruction itself if prompt generation fails.
      // eslint-disable-next-line no-console
      console.error("Gemini image-prompt generation failed:", e);
      finalPrompt = imagePromptInstruction;
    }
  }

  // Keep the final text we send to the image provider bounded so we don't
  // exceed limits like OpenAI's ~1000-char `prompt` max. This finalPrompt is
  // the ONLY text we send to the image model: it combines a concise
  // image-focused description plus a few instructions, not the entire chat
  // history.
  const MAX_PROMPT_LEN = 900;
  if (finalPrompt.length > MAX_PROMPT_LEN) {
    finalPrompt = finalPrompt.slice(0, MAX_PROMPT_LEN);
  }

  // ---- 3) Call the configured image provider with finalPrompt (+ image) ----

  const key =
    process.env.IMAGE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GENERATIVE_IMAGE_API_KEY;
  const provider = (
    process.env.IMAGE_PROVIDER ||
    (process.env.IMAGE_API_KEY
      ? "openai"
      : process.env.GEMINI_API_KEY
      ? "google"
      : "openai")
  ).toLowerCase();

  if (!key) {
    res
      .status(501)
      .json({
        error:
          "Server not configured for external image generation (missing IMAGE_API_KEY or equivalent)",
      });
    return;
  }

  // If you want to use Google/Gemini image generation, set IMAGE_PROVIDER=google
  // and we will call Gemini's multimodal model with both the short image prompt
  // and the uploaded reference image as inline data.
  if (provider === "google") {
    const geminiImageKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || key;
    if (!geminiImageKey) {
      res.status(501).json({
        error:
          "Server not configured for Gemini image generation (missing GEMINI_API_KEY/GOOGLE_API_KEY)",
      });
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiImageKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          // Ask Gemini to return an actual image, not text
          responseMimeType: "image/jpeg",
        },
      });

      const parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }> = [{ text: finalPrompt }];

      if (imageBase64 && imageMimeType) {
        const base64Data = imageBase64.includes(",")
          ? imageBase64.split(",")[1]
          : imageBase64;

        parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: base64Data,
          },
        });
      }

      const result = await (model as any).generateContent({
        contents: [{ role: "user", parts }],
      } as any);

      const response = result.response as any;
      const candidates = response?.candidates;

      if (!candidates || !candidates.length) {
        return res
          .status(500)
          .json({ error: "Gemini did not return any candidates for image generation" });
      }

      const contentParts = (candidates[0].content?.parts ?? []) as any[];

      for (const part of contentParts) {
        if (
          part.inlineData &&
          typeof part.inlineData.mimeType === "string" &&
          part.inlineData.mimeType.startsWith("image") &&
          typeof part.inlineData.data === "string"
        ) {
          const mime = part.inlineData.mimeType || "image/jpeg";
          const data = part.inlineData.data;
          return res.status(200).json({ url: `data:${mime};base64,${data}` });
        }
      }

      return res
        .status(500)
        .json({ error: "No image part found in Gemini response" });
    } catch (e: any) {
      console.error("Gemini image generation failed:", e);
      return res.status(500).json({ error: e?.message ?? String(e) });
    }
  }

  // Default: call OpenAI Images API (keep backward compatibility) using the
  // short, intermediate-generated image prompt. We DO NOT send the full chat
  // history or future transcript here, only the concise image-focused prompt.
  try {
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ prompt: finalPrompt, n: 1, size: "1024x1024" }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Image API error:", resp.status, txt);
      res.status(502).json({ error: "Image provider returned an error" });
      return;
    }

    const json = await resp.json();

    // Many providers return a URL or base64 data. Try common shapes.
    const url = json?.data?.[0]?.url ?? json?.data?.[0]?.b64_json ?? null;

    if (!url) {
      res.status(502).json({ error: "Unexpected image API response" });
      return;
    }

    // If provider responded with base64, prefix appropriately
    if (typeof url === "string" && url.startsWith("data:")) {
      res.status(200).json({ url });
      return;
    }

    if (typeof url === "string" && url.startsWith("/")) {
      // relative url; return direct
      res.status(200).json({ url });
      return;
    }

    // If provider returned b64 JSON
    if (typeof url === "string" && /^[A-Za-z0-9+/=\n]+$/.test(url)) {
      res.status(200).json({ url: `data:image/png;base64,${url}` });
      return;
    }

    // Otherwise assume it's a direct URL
    res.status(200).json({ url });
  } catch (e: any) {
    console.error("generate-image handler error:", e);
    res.status(500).json({ error: e?.message ?? String(e) });
  }
}
