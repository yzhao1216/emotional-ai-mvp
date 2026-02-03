/**
 * Chat orchestration: system prompt, advice/perspective flags, postprocess.
 */

import {
  assistantName,
  assistantPurpose,
  userAskedForAdvice,
  userAskedForPerspective,
} from "../core/identity";
import {
  postProcessAssistantText,
  type PostProcessOpts,
} from "../core/postprocess";
import type { ChatMessage } from "./types";

export function buildSystemPrompt(): string {
  return `You are ${assistantName}. ${assistantPurpose}
Do not diagnose, treat, or use clinical language. Do not use guilt, fear, or dependency.
Reflect and validate when it fits; clarify to understand, not to correct. Stay present.

Respond like a real person in conversation:
- Vary your openings. Do not start every reply by repeating or paraphrasing what they said at length.
- Sometimes acknowledge briefly (e.g. "Yeah." / "Mm." / one short line), then respond. Sometimes ask a follow-up or sit with them without a long lead-in.
- Keep empathy natural and concise. A brief "that sounds hard" or "I hear you" is enough; avoid long "I hear that you're feeling X and that Y..." every time.
- Do not follow a formula (reflect → confirm → question). Let your response match the moment—short when that fits, a bit longer when it helps.`;
}

export function getPostprocessOpts(lastUserMessage: string): PostProcessOpts {
  return {
    userAskedForAdvice: userAskedForAdvice(lastUserMessage),
    userAskedForPerspective: userAskedForPerspective(lastUserMessage),
  };
}

/**
 * Postprocess raw assistant text using the last user message to set advice/perspective flags.
 */
export function processAssistantReply(
  rawReply: string,
  lastUserMessage: string
): string {
  const opts = getPostprocessOpts(lastUserMessage);
  return postProcessAssistantText(rawReply, opts);
}

export type { ChatMessage };
