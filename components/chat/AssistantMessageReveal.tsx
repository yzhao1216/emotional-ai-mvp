/**
 * Human-paced assistant reveal: 1–3 conversational chunks, noticeable pauses, no typewriter.
 * Respects prefers-reduced-motion. Buffer full text before revealing (streaming: pass complete text).
 */

import { useEffect, useState, useMemo, useRef } from "react";
import {
  SHORT_MESSAGE_MAX_CHARS,
  MAX_CHUNKS,
  CHUNK_FADE_MS,
  CHUNK_GAP_MS_MIN,
  CHUNK_GAP_MS_MAX,
  CHUNK_GAP_JITTER_MS,
  CHUNK_VISIBLE_THRESHOLD,
  CHUNK_TRANSLATE_PX,
  REFOCUS_DELAY_MS,
  REVEAL_SPEED_MULTIPLIER,
} from "../../lib/revealConstants";

function getGapMs(): number {
  const range = CHUNK_GAP_MS_MAX - CHUNK_GAP_MS_MIN;
  const base = CHUNK_GAP_MS_MIN + Math.random() * range;
  const jitter = (Math.random() * 2 - 1) * CHUNK_GAP_JITTER_MS;
  return Math.max(0, (base + jitter) * REVEAL_SPEED_MULTIPLIER);
}

/**
 * Split by sentences so there’s a stop (pause) between each, like human speech.
 * One short sentence → single chunk. Else: one chunk per sentence, up to MAX_CHUNKS; remainder in last chunk.
 */
function splitIntoChunks(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const sentences = (trimmed.match(/[^.!?]+[.!?]*\s*|.+$/g) ?? [trimmed])
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return [trimmed];

  if (sentences.length <= MAX_CHUNKS) {
    return sentences;
  }

  const chunks = sentences.slice(0, MAX_CHUNKS - 1);
  const rest = sentences.slice(MAX_CHUNKS - 1).join(" ").trim();
  if (rest) chunks.push(rest);
  return chunks;
}

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = () => setPrefersReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefersReduced;
}

export interface AssistantMessageRevealProps {
  content: string;
  onRevealComplete?: () => void;
}

export function AssistantMessageReveal({ content, onRevealComplete }: AssistantMessageRevealProps) {
  const chunks = useMemo(() => splitIntoChunks(content), [content]);
  const [visibleCount, setVisibleCount] = useState(0);
  const onCompleteRef = useRef(onRevealComplete);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    onCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    if (chunks.length === 0) {
      onRevealComplete?.();
      return;
    }

    if (prefersReducedMotion) {
      setVisibleCount(chunks.length);
      const t = setTimeout(() => onCompleteRef.current?.(), 0);
      return () => clearTimeout(t);
    }

    const fadeMs = CHUNK_FADE_MS * REVEAL_SPEED_MULTIPLIER;
    const delayUntilMostlyVisible = fadeMs * CHUNK_VISIBLE_THRESHOLD;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const revealNext = (index: number) => {
      if (!mounted || index >= chunks.length) {
        if (mounted && index >= chunks.length) {
          const afterFadeAndRefocus = (fadeMs + REFOCUS_DELAY_MS) * REVEAL_SPEED_MULTIPLIER;
          timeoutId = setTimeout(() => onCompleteRef.current?.(), afterFadeAndRefocus);
        }
        return;
      }
      setVisibleCount(index + 1);
      const gap = getGapMs();
      const nextDelay = delayUntilMostlyVisible + gap;
      timeoutId = setTimeout(() => revealNext(index + 1), nextDelay);
    };

    setVisibleCount(1);
    if (chunks.length > 1) {
      timeoutId = setTimeout(() => revealNext(1), delayUntilMostlyVisible + getGapMs());
    } else {
      timeoutId = setTimeout(
        () => onCompleteRef.current?.(),
        (fadeMs + REFOCUS_DELAY_MS) * REVEAL_SPEED_MULTIPLIER
      );
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [content, chunks.length, prefersReducedMotion]);

  if (chunks.length === 0) return null;

  const reducedClass = prefersReducedMotion ? " assistant-reveal--reduced-motion" : "";

  return (
    <div
      className={`assistant-reveal${reducedClass}`}
      style={
        prefersReducedMotion
          ? undefined
          : ({
              "--chunk-fade-ms": CHUNK_FADE_MS * REVEAL_SPEED_MULTIPLIER,
              "--chunk-translate-px": CHUNK_TRANSLATE_PX,
            } as React.CSSProperties)
      }
    >
      {chunks.map((chunk, i) => (
        <div
          key={i}
          className={
            i < visibleCount
              ? "assistant-reveal__chunk assistant-reveal__chunk--visible"
              : "assistant-reveal__chunk"
          }
        >
          {chunk}
        </div>
      ))}
    </div>
  );
}
