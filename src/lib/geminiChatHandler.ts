import { GoogleGenerativeAI, Part, GenerativeModel, ChatSession } from "@google/generative-ai";

export interface ChatMessage {
    role: "user" | "model";
    parts: string;
}

export interface ChatHandlerConfig {
    apiKey: string;
    modelName?: string;
    systemInstruction?: string;
}

export class GeminiChatHandler {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private chat?: ChatSession;
    private history: ChatMessage[] = [];

    constructor(config: ChatHandlerConfig) {
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: config.modelName || "gemini-2.5-flash",
            systemInstruction: config.systemInstruction,
        });
    }

    async startChat(initialHistory: ChatMessage[] = []): Promise<void> {
        this.history = initialHistory;
        this.chat = this.model.startChat({
            history: this.history.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.parts }],
            })),
        });
    }

    async sendMessage(message: string, image?: { imageBase64: string | null; imageMimeType: string | null }): Promise<string> {
        if (!this.chat) {
            await this.startChat();
        }
        
        const parts: Part[] = [{text: message}];

        if (image && image.imageBase64 && image.imageMimeType) {
            const base64Data = image.imageBase64.replace(/^data:[^;]+;base64,/, "");
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: image.imageMimeType,
                }
            });
        }

        const result = await this.chat!.sendMessage(parts);
        const response = result.response;
        const text = response.text();

        this.history.push({ role: "user", parts: message });
        this.history.push({ role: "model", parts: text });

        return text;
    }

    async sendMessageStream(
        message: string,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        if (!this.chat) {
            await this.startChat();
        }

        const result = await this.chat!.sendMessageStream(message);
        let fullText = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            onChunk(chunkText);
        }

        this.history.push({ role: "user", parts: message });
        this.history.push({ role: "model", parts: fullText });

        return fullText;
    }

    getHistory(): ChatMessage[] {
        return [...this.history];
    }

    clearHistory(): void {
        this.history = [];
        this.chat = undefined;
    }

    resetChat(): void {
        this.clearHistory();
        this.startChat();
    }
}
