# Emotional AI Chat App — Structure & Components

Proposed structure and components for a chat app that follows [principles.md](./principles.md) and uses [core/identity](../core/identity.ts) + [core/postprocess](../core/postprocess.ts).

---

## 1. App structure (folders)

```
emotional-ai-mvp/
├── core/                    # Already exists: identity, postprocess
├── docs/                    # Principles, this doc
├── app/                     # App entry & layout (if using Next.js/React Router)
│   └── (routes, layout)
├── components/              # UI components
│   ├── chat/
│   ├── ui/                  # Shared primitives
│   └── ...
├── lib/                     # Shared app logic (API client, state, types)
│   ├── api.ts
│   ├── chat.ts              # Chat state / message handling
│   └── types.ts
├── hooks/                   # React hooks (e.g. useChat, usePostprocess)
├── styles/                  # Global / theme (optional)
├── public/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**Layers:**

| Layer      | Role |
|-----------|------|
| **core/** | Identity, guardrails, postprocess — no UI, no network. |
| **lib/**   | API client, chat orchestration, types. Calls core for `userAskedForAdvice`, `userAskedForPerspective`, `postProcessAssistantText`. |
| **hooks/** | React state for chat, loading, error; optionally wrap lib. |
| **components/** | UI only; receive data/callbacks from hooks or pages. |
| **app/**   | Routes, layout, page-level composition. |

---

## 2. Components

### 2.1 Chat-specific components

| Component        | Responsibility |
|------------------|----------------|
| **ChatLayout**   | Full chat view: header (e.g. Anchor name + purpose), message list, input area. |
| **MessageList**  | Scrollable list of messages; auto-scroll to bottom. |
| **Message**      | Single message bubble (user vs assistant); avatar, name, content, timestamp (optional). |
| **ChatInput**    | Text field + send button; optional character limit, disabled while sending. |
| **TypingIndicator** | Shown while assistant is “thinking” (optional). |
| **EmptyState**   | First-time / no messages: short intro aligned with identity (empathy, clarify, stay; advice only if asked). |

### 2.2 Shared UI components

| Component   | Responsibility |
|-------------|----------------|
| **Button**  | Primary/secondary; accessible. |
| **Textarea / Input** | Used inside ChatInput. |
| **ScrollArea** | For MessageList. |
| **Header**   | App title + optional nav (e.g. “Anchor” + link to principles/settings). |

### 2.3 Optional / future

- **DisclaimerBanner**: “Not a therapist or medical professional; for support only.”
- **ConsentOrPreferences**: Minimal emotional memory / continuity (per principles).
- **ErrorBoundary**: Graceful error state for chat failures.

---

## 3. Logical / non-UI “components” (lib + core)

| Piece | Responsibility |
|-------|----------------|
| **core/identity** | `assistantName`, `assistantPurpose`, `userAskedForAdvice(userMessage)`, `userAskedForPerspective(userMessage)`. |
| **core/postprocess** | `postProcessAssistantText(text, { userAskedForAdvice, userAskedForPerspective })` — always run assistant text through this before showing. |
| **lib/api** | Call LLM API (e.g. OpenAI/Anthropic); send system prompt built from identity; send conversation; return raw assistant reply. |
| **lib/chat** | Build system prompt from `assistantName` + `assistantPurpose`; for each user message compute `userAskedForAdvice` / `userAskedForPerspective`; get reply from API; run reply through `postProcessAssistantText`; append to messages. |
| **System prompt** | Derived from identity: Anchor, purpose (empathy / clarify / stay / no unsolicited advice), and principles (no diagnosis, no guilt/fear/dependency, no rationalizing values). |

---

## 4. Data flow (high level)

1. **User sends message** → ChatInput submits.
2. **Append user message** to chat state; show in MessageList.
3. **Compute flags**: `userAskedForAdvice(lastUserMessage)`, `userAskedForPerspective(lastUserMessage)` (from core/identity).
4. **Call API** with system prompt + conversation; get raw assistant reply.
5. **Postprocess**: `postProcessAssistantText(rawReply, { userAskedForAdvice, userAskedForPerspective })` (core/postprocess).
6. **Append assistant message** (postprocessed text) to chat state; show in MessageList.
7. **Optional**: Persist minimal “emotional memory” patterns only (per principles), not full transcript.

---

## 5. Tech stack suggestions (MVP)

- **Frontend**: React (Vite or Next.js), TypeScript.
- **Styling**: Tailwind or CSS modules.
- **State**: React state or a small store (e.g. Zustand) for messages + loading/error.
- **API**: One backend route (or serverless) that calls the LLM and returns raw text; frontend does postprocess so guardrails always run in a single place.

---

## 6. Principles → implementation checklist

- **Empathy, clarify, stay** → System prompt + postprocess (reflection starters, no unsolicited advice).
- **No advice unless asked** → `userAskedForAdvice` + `postProcessAssistantText` opts.
- **No diagnosis/treatment** → System prompt + no clinical language in identity.
- **No guilt/fear/dependency** → Banned phrases + system prompt.
- **Minimal emotional memory** → No full transcript storage; optional pattern-only persistence later.

This gives you a clear **structure** (folders, layers) and **components** (UI + lib/core) to build the emotional AI chat app on top of your existing principles and identity.
