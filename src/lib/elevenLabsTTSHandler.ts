import axios from "axios";

export interface TTSHandlerConfig {
    apiKey: string;
    voiceId?: string;
    modelId?: string;
}

export class ElevenLabsTTSHandler {
    private apiKey: string;
    private voiceId: string;
    private modelId: string;

    constructor(config: TTSHandlerConfig) {
        this.apiKey = config.apiKey;
        this.voiceId = config.voiceId || "eleven_monolingual_v1";
        this.modelId = config.modelId || "eleven_multilingual_v2";
    }

    async generate(text: string): Promise<Buffer> {
        try {
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
                {
                    text,
                    model_id: this.modelId,
                },
                {
                    headers: {
                        "xi-api-key": this.apiKey,
                        "Content-Type": "application/json",
                    },
                    responseType: "arraybuffer",
                }
            );

            return Buffer.from(response.data);
        } catch (err: any) {
            console.error("ElevenLabs TTS Error:", err.response?.data || err.message);
            throw new Error("TTS generation failed.");
        }
    }
}
