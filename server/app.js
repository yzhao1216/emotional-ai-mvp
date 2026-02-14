import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import chatRoutes from "./routes/chat.js";

const app = express();

const allowedOrigins =
  process.env.CLIENT_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
