import { GoogleGenerativeAI } from "@google/generative-ai";

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
    private model: any;
    private chat: any;
    private history: ChatMessage[] = [];

    constructor(config: ChatHandlerConfig) {
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: config.modelName || "gemini-2.5-flash-image",
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

    async sendMessage(message: string): Promise<string> {
        if (!this.chat) {
            await this.startChat();
        }

        const result = await this.chat.sendMessage(message);
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

        const result = await this.chat.sendMessageStream(message);
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
        this.chat = null;
    }

    resetChat(): void {
        this.clearHistory();
        this.startChat();
    }
}