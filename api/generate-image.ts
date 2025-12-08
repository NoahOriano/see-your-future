// api/generate-image.ts
// Vercel-style serverless function that proxies image generation requests to
// an external image API using a server-only environment variable.
//
// To use: set the environment variable IMAGE_API_KEY (OpenAI) or configure
// IMAGE_PROVIDER to 'google' and provide a Google image key. Do NOT commit
// secrets to the repository. The function expects a POST JSON body: { prompt: string }.

// No direct dependency on Vercel types here so the file remains usable in
// different serverless environments. The handler expects the standard
// (req, res) signature.
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing 'prompt' in request body" });
    return;
  }

  // Accept several env var names to make configuring providers easier
  const key = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || process.env.GENERATIVE_IMAGE_API_KEY;
  const provider = (process.env.IMAGE_PROVIDER || (process.env.IMAGE_API_KEY ? "openai" : process.env.GEMINI_API_KEY ? "google" : "openai")).toLowerCase();

  if (!key) {
    res.status(501).json({ error: "Server not configured for external image generation (missing IMAGE_API_KEY or equivalent)" });
    return;
  }

  // Currently the code supports OpenAI-style image endpoints out of the box.
  // If you want to use Google/Gemini image generation, set IMAGE_PROVIDER=google
  // and implement the provider call here (or ask me to implement it for you).
  if (provider === "google") {
    // Try to use the installed @google/generative-ai SDK if present.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const g = new GoogleGenerativeAI(key);

      // The SDK surface can change between versions; try several common entry points.
      let rawResp: any = null;

      // 1) Modern SDK might expose images.generate
      if (g.images && typeof g.images.generate === "function") {
        rawResp = await g.images.generate({ prompt, size: "1024x1024", n: 1 });
      }

      // 2) Older/newer variants might have generateImage
      if (!rawResp && typeof g.generateImage === "function") {
        rawResp = await g.generateImage({ prompt, size: "1024x1024", n: 1 });
      }

      // 3) Some SDKs return a model object to call
      if (!rawResp && typeof g.getImage === "function") {
        rawResp = await g.getImage({ prompt, size: "1024x1024" });
      }

      if (!rawResp) {
        return res.status(501).json({ error: "Unable to call Google image API using the installed SDK: no compatible method found. Please set IMAGE_PROVIDER=openai and provide an OpenAI-compatible IMAGE_API_KEY, or ask me to implement a provider-specific call for your SDK version." });
      }

      // Try to extract URL or base64 data from common response shapes
      // Common fields attempt
      const url = rawResp?.data?.[0]?.url ?? rawResp?.data?.[0]?.b64_json ?? rawResp?.images?.[0]?.url ?? rawResp?.images?.[0]?.b64_json ?? rawResp?.output?.[0]?.image ?? null;

      if (!url) {
        // Fallback: return the raw SDK response for debugging
        return res.status(200).json({ raw: rawResp });
      }

      if (typeof url === "string" && /^[A-Za-z0-9+/=\n]+$/.test(url)) {
        return res.status(200).json({ url: `data:image/png;base64,${url}` });
      }

      return res.status(200).json({ url });
    } catch (e: any) {
      console.error("Google image generation failed:", e);
      return res.status(500).json({ error: e?.message ?? String(e) });
    }
  }

  try {
    // Default: call OpenAI Images API (keep backward compatibility).
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ prompt, n: 1, size: "1024x1024" }),
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
