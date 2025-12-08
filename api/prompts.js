// api/prompts.js
// Server-side mirror of src/lib/prompts.ts so Vercel functions don't need to import TS modules.

/**
 * Build the system prompt for generating a future description from a questionnaire transcript.
 * Mirrors src/lib/prompts.ts: generateFuturePrompt.
 * @param {string} transcript
 * @returns {string}
 */
export function generateFuturePrompt(transcript) {
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
 * requested round number. Mirrors src/lib/prompts.ts: generateRoundQuestionsPrompt.
 * @param {string} transcript
 * @param {number} requestedRoundNumber
 * @returns {string}
 */
export function generateRoundQuestionsPrompt(transcript, requestedRoundNumber) {
  return `\
Based on the following questionnaire transcript, please generate a few open-ended follow-up questions for Round ${requestedRoundNumber}.\n\
These questions should primarily dig deeper into the user's habits, actions, and typical behaviors.\n\
The purpose of these questions is to as quickly as possible determine the quality of someone's life, don't be afraid to ask harder questions, but don't dive into overly sensitive topics without decent context and reason.\n\
\n\
Return only the questions themselves, as plain text, with decent spacing between each question with the prompt "(Your answer here)".\n\
${transcript}\n`;
}

/**
 * Build an image-generation prompt from a future description.
 * Mirrors src/lib/prompts.ts: generateImagePrompt.
 * @param {string} futureDescription
 * @returns {string}
 */
export function generateImagePrompt(futureDescription) {
  return `\
Based on the following description of someone's future, generate a short, vivid, and descriptive prompt for an image generation model.\n\
The prompt should capture the essence of the future described. Keep it realistic and grounded.\n\
\n\n${futureDescription}\n`;
}
