/**
 * Backend proxy for Anthropic API. Keeps the API key on the server and avoids CORS.
 * Run: npm run dev:server (or npm run dev to run server + Vite).
 */

import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"] }));
app.use(express.json());

app.post("/api/chat", async (req, res) => {
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
        model: "claude-haiku-4-5-20251001",
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
