// src/lib/imageGeneratorHandler.ts
/**
 * Lightweight client-side image generator used as a safe default during
 * development. It renders the provided prompt into a simple SVG and returns
 * a data URL. This avoids requiring any external image API or keys.
 */
export async function generateImageFromFuture(prompt: string): Promise<string> {
  // First, attempt to call a local serverless endpoint (if available).
  // This allows deployments to use a server-only API key while local dev
  // falls back to an inline SVG generator.
  if (typeof window !== "undefined" && typeof fetch === "function") {
    try {
      const resp = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json?.url) return json.url;
      }
      // If we get here, serverless endpoint didn't produce an image; fallthrough
    } catch (e) {
      // Ignore and fall back to SVG
      // console.debug("Serverless image generation unavailable, falling back to SVG", e);
    }
  }

  // Fallback: generate a simple SVG data URL client-side.
  const short = prompt.length > 300 ? prompt.slice(0, 300) + "…" : prompt;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='#7b2ff7'/>
        <stop offset='1' stop-color='#2b86c5'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)' />
    <foreignObject x='60' y='60' width='1080' height='510'>
      <div xmlns='http://www.w3.org/1999/xhtml' style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: white; font-size:28px; line-height:1.35;'>
        ${escapeXml(short).replace(/\n/g, '<br/>')}
      </div>
    </foreignObject>
  </svg>`;

  let base64: string;
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    base64 = window.btoa(unescape(encodeURIComponent(svg)));
  } else {
    // Fallback for Node (tests or SSR)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const buf = Buffer.from(svg);
    base64 = buf.toString("base64");
  }

  return `data:image/svg+xml;base64,${base64}`;
}

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
