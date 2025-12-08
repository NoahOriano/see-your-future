// api/generate-image-gemini.ts
// Server endpoint to generate an image using Gemini (Google Generative AI).
// Expects POST { description: string }
 
import { GoogleGenerativeAI } from "@google/generative-ai";
 
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
 
  const { description } = req.body ?? {};
  if (!description) return res.status(400).json({ error: "Missing description in request body" });
 
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "Server not configured for Gemini (GEMINI_API_KEY missing)" });
  }
 
  const prompt = `Generate an image that visually represents the following future scenario: ${description}`;
 
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
 
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
 
    // Assuming the first part of the response contains the image data
    const firstPart = response.response?.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && firstPart.inlineData) {
      const imageData = firstPart.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      res.setHeader("Content-Type", "image/png");
      return res.status(200).send(buffer);
    } else {
      return res.status(500).json({ error: "Image data not found in response" });
    }
  } catch (e: any) {
    console.error("generate-image-gemini error:", e);
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}
