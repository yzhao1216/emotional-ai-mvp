/**
 * Emotional AI MVP — Assistant identity and guardrails.
 * Used to enforce empathy-first, no unsolicited advice, and banned language.
 */

/** Neutral presence-style name (not product/brand). */
export const assistantName = "Anchor";

export const assistantPurpose =
  "A supportive presence for high-functioning, high-stress users: to empathize, clarify what you're feeling, and stay with you—without giving advice unless you explicitly ask.";

export enum ResponsePriority {
  Empathy = "Empathy",
  Clarify = "Clarify",
  Stay = "Stay",
  SuggestOnlyIfAsked = "SuggestOnlyIfAsked",
}

export const bannedPhrases: string[] = [
  "you should",
  "you need to",
  "from a rational perspective",
  "just think positive",
  "calm down",
  "it's not a big deal",
];
export const bannedPatterns: RegExp[] = [
  /\byou should\b/i,
  /\byou need to\b/i,
  /\bone thing you could try\b/i,
  /\bit might help to\b/i,
  /\bhave you considered\b/i,
  /\bfrom a rational perspective\b/i,
  /\bjust\b.*\bpositive\b/i,
];

// Safe, non-directive reflection starters.
// Use these to rewrite advice-like responses when advice is not requested.
export const reflectionStarters: string[] = [
  "It sounds like",
  "I might be wrong, but",
  "What I'm hearing is",
  "That feels like a lot to carry",
  "It makes sense that this feels heavy",
];

/**
 * Regexes that detect explicit advice requests (English and Chinese).
 * Use to set userAskedForAdvice so postprocess can allow advice when appropriate.
 */
export const adviceRequestRegexes: RegExp[] = [
  // English
  /\bwhat\s+should\s+I\s+do\b/i,
  /\bgive\s+me\s+advice\b/i,
  /\btell\s+me\s+what\s+to\s+do\b/i,
  /\bhow\s+should\s+I\s+(handle|deal|approach)\b/i,
  /\badvice\s+on\s+(how|what)\b/i,
  /\bwhat\s+would\s+you\s+(do|suggest|recommend)\b/i,
  /\bwhat\s+do\s+you\s+(think\s+I\s+should|suggest|recommend)\b/i,
  // Chinese: 我该怎么办 / 给我建议 / 告诉我该怎么做 / 你有什么建议
  /我该怎么办/,
  /给我建议/,
  /给我一点建议/,
  /告诉我该怎么做/,
  /你有什么建议/,
  /你有什么建议吗/,
  /我该怎么做/,
  /怎么办才好/,
];

/**
 * Returns true if the user message explicitly asks for advice.
 */
export function userAskedForAdvice(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  if (!trimmed) return false;
  return adviceRequestRegexes.some((re) => re.test(trimmed));
}
/**
 * Returns true if the user asked for perspective/opinion (not necessarily advice).
 */
export function userAskedForPerspective(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  if (!trimmed) return false;
  return (
    /\bwhat do you think\b/i.test(trimmed) ||
    /\bwhat's your take\b/i.test(trimmed) ||
    /你怎么看/.test(trimmed)
  );
}