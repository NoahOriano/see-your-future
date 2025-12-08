// api/generate-tts.ts
// Server endpoint to generate text-to-speech audio using ElevenLabs.
// Expects POST { text: string, voiceId?: string }

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, voiceId = "Rachel" } = req.body ?? {};

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing 'text' in request body" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "ELEVENLABS_API_KEY is not set on the server" });
  }

  try {
    // ElevenLabs TTS REST API (non-streaming)
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: `ElevenLabs error: ${response.statusText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    return res.status(200).json({ audioBase64 });
  } catch (e: any) {
    console.error("generate-voice error:", e);
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}
