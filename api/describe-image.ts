// api/describe-image.ts
// Import server-side Gemini handler implemented as plain JS for Vercel runtime
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { GeminiChatHandler } from "./geminiChatHandler.js";
import type { IncomingMessage, ServerResponse } from "http";

interface RequestBody {
  imageBase64?: string;
  imageMimeType?: string;
}

interface RequestWithBody extends IncomingMessage {
    body?: RequestBody;
}

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const { imageBase64, imageMimeType } = req.body ?? {};
  if (!imageBase64 || !imageMimeType) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Missing image data" }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.statusCode = 501;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Server not configured for Gemini (GEMINI_API_KEY missing)" }));
    return;
  }

  try {
    // Use a multimodal-capable Gemini 2.0 model (text + image) – matches the working image handler
    const handler = new GeminiChatHandler({ apiKey, modelName: "gemini-2.0-flash-exp" });
    const prompt = "Describe this image in a few sentences. This description will be used to generate a story about the person in the image.";
    const description = await handler.sendMessage(prompt, { imageBase64, imageMimeType });
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ description }));
  } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("describe-image error:", e);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: e.message ?? String(e) }));
        return;
      }
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: "Unknown error" }));
  }
}
