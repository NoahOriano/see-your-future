import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiChatHandler {
  #genAI;
  #model;
  #chat;
  #history = [];

  constructor(config) {
    const { apiKey, modelName = "gemini-2.0-flash-exp", systemInstruction } = config;
    this.#genAI = new GoogleGenerativeAI(apiKey);
    this.#model = this.#genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });
  }

  async startChat(initialHistory = []) {
    this.#history = initialHistory;
    this.#chat = this.#model.startChat({
      history: this.#history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
    });
  }

  async sendMessage(message, image) {
    if (!this.#chat) {
      await this.startChat();
    }

    /** @type {import("@google/generative-ai").Part[]} */
    const parts = [{ text: message }];

    if (image && image.imageBase64 && image.imageMimeType) {
      const base64Data = image.imageBase64.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: image.imageMimeType,
        },
      });
    }

    const result = await this.#chat.sendMessage(parts);
    const response = result.response;
    const text = response.text();

    this.#history.push({ role: "user", parts: message });
    this.#history.push({ role: "model", parts: text });

    return text;
  }

  async sendMessageStream(message, onChunk) {
    if (!this.#chat) {
      await this.startChat();
    }

    const result = await this.#chat.sendMessageStream(message);
    let fullText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }

    this.#history.push({ role: "user", parts: message });
    this.#history.push({ role: "model", parts: fullText });

    return fullText;
  }

  getHistory() {
    return [...this.#history];
  }

  clearHistory() {
    this.#history = [];
    this.#chat = undefined;
  }

  resetChat() {
    this.clearHistory();
    this.startChat();
  }
}
