// src/lib/prompts.ts
export function generateFuturePrompt(transcript: string): string {
  return `\
You are helping generate a narrative "future" for a user based on a questionnaire.\n\n\
Use ONLY the information in the questionnaire. Do NOT reveal the questions directly.\n\
Instead, infer themes, directions, and likely life trajectories over the next 10–20 years.\n\
Avoid supernatural guarantees or exact dates. Speak in terms of tendencies, risks, and opportunities.\n\
When user's stated intent contradicts their behavior, prioritize their behavior. For example, if a user says they care about health but also say they drink 5 cans of soda each day, the fact that they drink soda should have a much greater weight over their stated intent.\n\
\n\
You must respond ONLY in JSON with this exact structure:\n\n\
{\n+  "description": "a detailed multi-paragraph narrative about the person's future",\n+  "qualityScore": 0-100 number representing how positive/fulfilling the future is overall,\n+  "qualityLabel": "a short qualitative label like 'Challenging', 'Balanced', 'Strong Outlook'"\n+}\n\n\
Here is the questionnaire data:\n\n${transcript}\n`;
}

/**
 * Prompt that asks the LLM to generate a set of follow-up questions for the
 * requested round number. The model should return a simple text response with a few questions.
 */
export function generateRoundQuestionsPrompt(
  transcript: string,
  requestedRoundNumber: number
): string {
  return `\
Based on the following questionnaire transcript, please generate a few open-ended follow-up questions for Round ${requestedRoundNumber}.

Return only the questions themselves, as plain text, with decent spacing between each question with the prompt "(Your answer here)".

${transcript}
`;
}

export function generateImagePrompt(futureDescription: string): string {
  return `\
Based on the following future description, generate a short, vivid, and descriptive prompt for an image generation model.
The prompt should capture the essence of the future described.
\n\n${futureDescription}\n`;
}
