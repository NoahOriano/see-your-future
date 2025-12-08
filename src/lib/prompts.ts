// src/lib/prompts.ts
export function generateFuturePrompt(transcript: string): string {
  return `\
You are helping generate a descriptive "future" for a user based on a questionnaire.\n\n\
Use ONLY the information in the questionnaire. Do NOT reveal the questions directly.\n\
Instead, infer themes, directions, and likely life trajectories over the next 10–20 years.\n\
Although this is a "future", do not make signficant references to futuristic ideas or ideals. Assume the world has not changed much, just the user.\n\
Avoid supernatural guarantees or exact dates. Try to be realistic, cautious, and critical. One of the main purposes of this "future" is to help improve someone's decision-making and planning.\n\
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
These questions should primarily dig deeper into the user's habits, actions, and typical behaviors.
The purpose of these questions is to as quickly as possible determine the quality of someone's life, don't be afraid to ask harder questions, but don't dive into overly sensitive topics without decent context and reason.

Return only the questions themselves, as plain text, with decent spacing between each question with the prompt "(Your answer here)".

${transcript}
`;
}

export function generateImagePrompt(futureDescription: string): string {
  return `You are an expert visual prompt writer for a realistic photographic image model.\n\n\
Given the following description of someone's life and future context, write a SINGLE, concise English prompt (no more than 1–2 short sentences) that a text-to-image model can use to render a realistic scene.\n\n\
Requirements:\n- Focus on how the person looks (age, gender presentation, clothing, expression, posture) and their immediate environment.\n- Make it clear what the person is doing in the scene and what setting they are in.\n- Prefer concrete visual details over abstract concepts or metaphors.\n- Do NOT mention questionnaires, descriptions, prompts, "future", or anything about how this text was generated.\n- Do NOT include quotation marks or any extra commentary – just the prompt itself.\n\n\
DESCRIPTION:\n${futureDescription}\n`;
}
