/**
 * First-time / no messages: intro aligned with identity (empathy, clarify, stay).
 */

export function EmptyState() {
  return (
    <div className="empty-state">
      <p>
        A supportive presence: to empathize, clarify what you're feeling, and
        stay with you—without giving advice unless you explicitly ask.
      </p>
      <p className="empty-state__hint">Say what's on your mind.</p>
    </div>
  );
}
