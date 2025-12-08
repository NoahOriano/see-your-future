// src/lib/prompts.ts
export function generateFuturePrompt(transcript: string): string {
  return `\
You are helping generate a narrative "future" for a user based on a questionnaire.\n\n\
Use ONLY the information in the questionnaire. Do NOT reveal the questions directly.\n\
Instead, infer themes, directions, and likely life trajectories over the next 10–20 years.\n\
Avoid supernatural guarantees or exact dates. Speak in terms of tendencies, risks, and opportunities.\n\
\n\
You must respond ONLY in JSON with this exact structure:\n\n\
{\n+  "description": "a detailed multi-paragraph narrative about the person's future",\n+  "qualityScore": 0-100 number representing how positive/fulfilling the future is overall,\n+  "qualityLabel": "a short qualitative label like 'Challenging', 'Balanced', 'Strong Outlook'"\n+}\n\n\
Here is the questionnaire data:\n\n${transcript}\n`;
}

/**
 * Prompt that asks the LLM to generate a set of follow-up questions for the
 * requested round number. The model should return a JSON array of question
 * objects with fields: id, prompt, type, category (optional), options (optional array).
 */
export function generateRoundQuestionsPrompt(
  transcript: string,
  requestedRoundNumber: number
): string {
  return `\
You are tasked with generating a concise set (3-6) of follow-up questions for Round ${requestedRoundNumber} based only on the following questionnaire transcript:\n\n${transcript}\n\nConstraints and guidance:\n1) DO NOT repeat questions that already appeared in the transcript. If a topic was already asked, produce a deeper follow-up that adds specificity or clarifies barriers, motivations, or concrete next steps.\n2) Produce varied question types (text, select, slider) when appropriate.\n3) Keep prompts concise (one sentence).\n4) Avoid generic template questions like \"How strong is your support network?\" unless the transcript strongly indicates relationships are central; prefer focused phrasing tied to user's answers.\n5) Return ONLY a JSON array of question objects (no surrounding text). Each object must include:\n   - id: a short machine-friendly id (no spaces)\n   - prompt: the question text to ask the user\n   - type: one of \"text\", \"select\", \"slider\"\n   - category: optional category like \"career\", \"health\", \"relationships\", \"finance\", \"personal\"\n   - options: optional array of strings when type is \"select\"\n\nExample output:\n[\n  {"id":"next_step","prompt":"What small, concrete step could you take in the next month to move toward this goal?","type":"text","category":"personal"},\n  {"id":"confidence","prompt":"How confident are you about taking that step?","type":"select","options":["Low","Medium","High"],"category":"personal"}\n]\n\nBe creative but grounded in the transcript. Prioritize clarity and avoid repetition.\n`;
}
