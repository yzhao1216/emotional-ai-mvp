/**
 * Human-paced assistant reveal: chunk timings, gaps, and dev speed toggle.
 *
 * Where to adjust (all in this file):
 * - CHUNK_FADE_MS: duration of each chunk’s fade-in (1200–1800ms feels human)
 * - CHUNK_GAP_MS_MIN / CHUNK_GAP_MS_MAX: pause between chunks (next starts after previous ~85% visible + this pause)
 * - CHUNK_GAP_JITTER_MS: random jitter added to that pause
 * - CHUNK_TRANSLATE_PX: vertical drift (px) at start of animation
 * - REFOCUS_DELAY_MS: delay after final chunk fully visible before focusing input
 * - REVEAL_SPEED_MULTIPLIER: dev testing (0.5 = faster, 2 = slower; 1 = normal)
 * - SHORT_MESSAGE_MAX_CHARS: single chunk if one short sentence
 * - MAX_CHUNKS: max sentence-level reveals (stop between each)
 */

/** Single chunk if reply is one short sentence (no stop needed). */
export const SHORT_MESSAGE_MAX_CHARS = 80;

/** Max sentence-level chunks (stop after each sentence); extra sentences go into last chunk. */
export const MAX_CHUNKS = 8;

/** Fade-in duration per chunk (ms). Slower = gentler; 2000–2600 feels like someone speaking. */
export const CHUNK_FADE_MS = 1200;

/** Min pause (ms) after chunk is fully visible — short stop before the next sentence. */
export const CHUNK_GAP_MS_MIN = 700;

/** Max pause (ms) in that range. */
export const CHUNK_GAP_MS_MAX = 1200;

/** Jitter added to gap: +/- this (ms). */
export const CHUNK_GAP_JITTER_MS = 200;

/** 1 = wait until chunk is fully visible, then add gap. Keeps a clear stop/breath between phrases. */
export const CHUNK_VISIBLE_THRESHOLD = 1;

/** Vertical drift in px at start of keyframe. */
export const CHUNK_TRANSLATE_PX = 14;

/** Delay after final chunk fully visible before refocusing input (ms). Slight breath before typing. */
export const REFOCUS_DELAY_MS = 1100;

/**
 * Dev/testing: multiply all reveal timings by this.
 * 0.5 = faster, 2 = slower, 1 = normal.
 */
export const REVEAL_SPEED_MULTIPLIER = 1;
