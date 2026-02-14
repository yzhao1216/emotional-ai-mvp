import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.post("/", authenticate, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server." });
    return;
  }

  const { systemPrompt, messages } = req.body;
  if (!systemPrompt || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing systemPrompt or messages." });
    return;
  }

  const anthropicMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const msg = data?.error?.message ?? anthropicRes.statusText;
      res.status(anthropicRes.status).json({ error: msg });
      return;
    }

    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("");
    res.json({ content: (text ?? "").trim() });
  } catch (e) {
    res.status(500).json({ error: e.message ?? "Server error." });
  }
});

export default router;
