/**
 * Subtle "presence" indicator while waiting for the AI (no spinner).
 * Breathing dots or "Listening…" — calm, non-distracting.
 */

export function PresenceIndicator() {
  return (
    <div
      className="presence-indicator"
      aria-live="polite"
      aria-label="Waiting for response"
    >
      <span className="presence-indicator__dots" aria-hidden="true">
        <span className="presence-indicator__dot" />
        <span className="presence-indicator__dot" />
        <span className="presence-indicator__dot" />
      </span>
      <span className="presence-indicator__label">Listening…</span>
    </div>
  );
}
