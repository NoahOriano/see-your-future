// src/lib/imageGeneratorHandler.ts

interface FutureImageOptions {
  imageBase64: string | null;
  imageMimeType: string | null;
  imageDescription?: string | null;
}

export async function generateImageFromFuture(
  prompt: string,
  options?: FutureImageOptions
): Promise<string> {
  if (typeof window !== "undefined" && typeof fetch === "function") {
    const resp = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        imageBase64: options?.imageBase64,
        imageMimeType: options?.imageMimeType,
        imageDescription: options?.imageDescription ?? null,
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      if (json?.url) return json.url;
    } else {
      const error = await resp.json();
      throw new Error(error.error || "Image generation failed");
    }
  }

  throw new Error("Image generation is not available in this environment.");
}
