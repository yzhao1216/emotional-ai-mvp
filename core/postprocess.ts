/**
 * Post-process assistant text to enforce guardrails:
 * - Strip or rewrite advice when user did not ask for it.
 * - When perspective requested but not advice: allow reflective opinions, no action steps.
 * - Always remove banned phrases (case-insensitive).
 * - Tone remains validating, slow, and non-directive.
 */

import {
  bannedPatterns,
  bannedPhrases,
  reflectionStarters,
  userAskedForAdvice,
  userAskedForPerspective,
} from "./identity";

export type PostProcessOpts = {
  userAskedForAdvice: boolean;
  userAskedForPerspective: boolean;
};

/**
 * Extra advice/action-step patterns (imperative or "you could/should").
 * Used when userAskedForAdvice is false. Identity's bannedPatterns cover
 * "it might help to", "have you considered", etc.
 */
const ADVICE_LIKE_PATTERNS: RegExp[] = [
  /\b(you\s+(?:could|might|may)\s+try)\b/i,
  /\b(you\s+(?:could|might|may)\s+consider)\b/i,
  /\b(I\s+(?:would|d suggest|d recommend)\s+(?:you\s+)?(?:try|consider|do))\b/i,
  /\b(one\s+option\s+is\s+to)\b/i,
  /\b(why\s+not\s+try)\b/i,
  /\b(the\s+best\s+way\s+(?:would\s+be|is)\s+to)\b/i,
];

const ALL_ADVICE_PATTERNS: RegExp[] = [...bannedPatterns, ...ADVICE_LIKE_PATTERNS];

/** Action-verb / directive phrasing that must not appear when neither advice nor perspective. */
const ACTION_VERB_PATTERNS: RegExp[] = [
  /\btry\s+(?:to\s+)?(?:taking|writing|talking|going)\b/i,
  /\bconsider\s+(?:taking|talking|writing)\b/i,
  /\byou\s+could\s+(?:try|consider|take|do)\b/i,
  /\bone\s+(?:option|thing)\s+(?:is\s+to|you\s+could)\b/i,
  ...ALL_ADVICE_PATTERNS,
];

/** Closers for rewritten sentences so they read as full reflections. */
const REFLECTION_CLOSERS: string[] = [
  "this is really hard.",
  "you're carrying a lot.",
  "that's a lot to sit with.",
];

function sentenceContainsAdviceOrBanned(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  for (const phrase of bannedPhrases) {
    if (lower.includes(phrase.toLowerCase())) return true;
  }
  for (const re of ALL_ADVICE_PATTERNS) {
    if (re.test(sentence)) return true;
  }
  return false;
}

function sentenceContainsActionStep(sentence: string): boolean {
  return sentenceContainsAdviceOrBanned(sentence);
}

/** True if sentence looks reflective only (starts with a reflection starter, no action step). */
function isReflectiveOnly(sentence: string): boolean {
  if (sentenceContainsActionStep(sentence)) return false;
  const trimmed = sentence.trim();
  return reflectionStarters.some((s) =>
    trimmed.toLowerCase().startsWith(s.toLowerCase())
  );
}

/**
 * Rewrite advice/action-step or banned sentences using reflection starters.
 * When allowReflective is true, keep sentences that are reflective-only.
 */
function rewriteAdviceSentences(
  text: string,
  allowReflective: boolean
): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return stripBannedPhrases(text);

  const parts: string[] = [];
  let reflectionIndex = 0;
  for (const sentence of sentences) {
    const shouldRewrite = allowReflective
      ? sentenceContainsActionStep(sentence)
      : sentenceContainsAdviceOrBanned(sentence);
    if (shouldRewrite) {
      const starter =
        reflectionStarters[reflectionIndex % reflectionStarters.length];
      const closer =
        REFLECTION_CLOSERS[reflectionIndex % REFLECTION_CLOSERS.length];
      parts.push(starter + " " + closer);
      reflectionIndex += 1;
    } else {
      parts.push(sentence);
    }
  }
  let result = parts.join(" ").replace(/\s{2,}/g, " ").trim();
  result = stripBannedPhrases(result);
  return result;
}

function stripBannedPhrases(text: string): string {
  let result = text;
  for (const phrase of bannedPhrases) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(re, "").replace(/\s{2,}/g, " ");
  }
  return result.trim();
}

/**
 * Post-process assistant reply for guardrails.
 *
 * - If userAskedForAdvice: only strip banned phrases; suggestions preserved.
 * - If userAskedForAdvice=false: rewrite sentences matching bannedPatterns/advice; prefer reflectionStarters.
 * - If userAskedForPerspective=true and advice=false: allow reflective opinions, rewrite only action steps.
 * - Always strip bannedPhrases. Tone remains validating, slow, non-directive.
 */
export function postProcessAssistantText(
  text: string,
  opts: PostProcessOpts
): string {
  if (!text || typeof text !== "string") return text;

  const { userAskedForAdvice: advice, userAskedForPerspective: perspective } =
    opts;
  let out = text;

  if (advice) {
    out = stripBannedPhrases(out);
  } else {
    out = rewriteAdviceSentences(out, perspective);
  }

  return out.trim() || text.trim();
}

/** Returns true if output contains any action-verb / directive phrasing. */
export function outputContainsActionVerbs(text: string): boolean {
  for (const re of ACTION_VERB_PATTERNS) {
    if (re.test(text)) return true;
  }
  return false;
}

export { userAskedForAdvice, userAskedForPerspective };
