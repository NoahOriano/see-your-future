// src/lib/textToVoiceHandler.ts
// Lightweight client helper to call the /api/generate-tts endpoint
// and return a base64-encoded MP3 string.

export async function generateTTS(
  text: string,
  voiceId: string = "Rachel"
): Promise<string> {
  const response = await fetch("/api/generate-tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    let message = `TTS request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // ignore JSON parse errors and fall back to generic message
    }

    throw new Error(message);
  }

  const data = await response.json();

  if (!data?.audioBase64 || typeof data.audioBase64 !== "string") {
    throw new Error("Invalid TTS response from server");
  }

  return data.audioBase64;
}
