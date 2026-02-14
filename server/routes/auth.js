import { Router } from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import prisma from "../prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  accessTokenTtlSeconds,
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenFromRequest,
  hashToken,
  setRefreshTokenCookie,
} from "../utils/tokens.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    profile: user.profile
      ? {
          name: user.profile.name,
          language: user.profile.language ?? "en",
        }
      : null,
    hasMfaEnabled: Boolean(user.mfaSecret?.verified),
  };
}

async function createRefreshSession(userId, refreshToken, req) {
  const userAgent = req.get("user-agent") ?? null;
  const ipAddress =
    (req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.socket.remoteAddress) ||
    null;

  await prisma.sessionRefreshToken.create({
    data: {
      userId,
      hashedToken: refreshToken.hashedToken,
      userAgent,
      ipAddress,
      expiresAt: refreshToken.expiresAt,
    },
  });
}

async function revokeRefreshToken(hashedToken) {
  await prisma.sessionRefreshToken.updateMany({
    where: { hashedToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

router.post("/register", async (req, res) => {
  const { email, password, name, language } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered." });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      profile: {
        create: {
          name: name?.trim() || null,
          language: language?.trim() || "en",
        },
      },
    },
    include: { profile: true, mfaSecret: true },
  });

  const refreshToken = generateRefreshToken();
  await createRefreshSession(user.id, refreshToken, req);

  setRefreshTokenCookie(res, refreshToken.token);

  const accessToken = generateAccessToken(user);

  res.status(201).json({
    user: sanitizeUser(user),
    accessToken,
    accessTokenExpiresIn: accessTokenTtlSeconds(),
  });
});

router.post("/login", async (req, res) => {
  const { email, password, mfaToken } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail) || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid credentials." });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true, mfaSecret: true },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials." });
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid credentials." });
  }

  if (user.mfaSecret?.verified) {
    if (!mfaToken) {
      return res.status(200).json({ mfaRequired: true });
    }
    const ok = speakeasy.totp.verify({
      secret: user.mfaSecret.secret,
      encoding: "base32",
      token: mfaToken,
      window: 1,
    });
    if (!ok) {
      return res.status(400).json({ error: "Invalid MFA token." });
    }
  }

  const refreshToken = generateRefreshToken();
  await createRefreshSession(user.id, refreshToken, req);
  setRefreshTokenCookie(res, refreshToken.token);

  const accessToken = generateAccessToken(user);
  res.json({
    user: sanitizeUser(user),
    accessToken,
    accessTokenExpiresIn: accessTokenTtlSeconds(),
  });
});

router.post("/refresh", async (req, res) => {
  const token = getRefreshTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hashedToken = hashToken(token);
  const stored = await prisma.sessionRefreshToken.findUnique({
    where: { hashedToken },
    include: { user: { include: { profile: true, mfaSecret: true } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: "Unauthorized" });
  }

  await revokeRefreshToken(hashedToken);

  const refreshToken = generateRefreshToken();
  await createRefreshSession(stored.userId, refreshToken, req);
  setRefreshTokenCookie(res, refreshToken.token);

  const accessToken = generateAccessToken(stored.user);
  res.json({
    user: sanitizeUser(stored.user),
    accessToken,
    accessTokenExpiresIn: accessTokenTtlSeconds(),
  });
});

router.post("/logout", async (req, res) => {
  const token = getRefreshTokenFromRequest(req);
  if (token) {
    await revokeRefreshToken(hashToken(token));
  }
  clearRefreshTokenCookie(res);
  res.json({ ok: true });
});

router.post("/password-reset/request", async (req, res) => {
  const { email } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(204).end();
  }

  const token = randomUUID() + randomUUID();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashedToken,
      expiresAt,
    },
  });

  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
    normalizedEmail
  )}`;
  await sendPasswordResetEmail(normalizedEmail, resetUrl);

  res.status(204).end();
});

router.post("/password-reset/confirm", async (req, res) => {
  const { token, password } = req.body ?? {};
  if (!token || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Invalid request." });
  }

  const hashedToken = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashedToken },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired token." });
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash: hashedToken },
      data: { usedAt: new Date() },
    }),
    prisma.sessionRefreshToken.updateMany({
      where: { userId: record.userId },
      data: { revokedAt: new Date() },
    }),
  ]);

  clearRefreshTokenCookie(res);
  res.json({ ok: true });
});

router.post("/mfa/setup", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { mfaSecret: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const secret = speakeasy.generateSecret({
    name: `${process.env.MFA_ISSUER ?? "Emotional AI"} (${user.email})`,
  });

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  if (user.mfaSecret) {
    await prisma.mfaSecret.update({
      where: { userId: user.id },
      data: { secret: secret.base32, verified: false },
    });
  } else {
    await prisma.mfaSecret.create({
      data: { userId: user.id, secret: secret.base32 },
    });
  }

  res.json({ otpauthUrl: secret.otpauth_url, qrDataUrl: qrDataUrl });
});

router.post("/mfa/verify", authenticate, async (req, res) => {
  const { token } = req.body ?? {};
  if (!token) {
    return res.status(400).json({ error: "MFA token required." });
  }

  const mfaSecret = await prisma.mfaSecret.findUnique({ where: { userId: req.user.id } });
  if (!mfaSecret) {
    return res.status(400).json({ error: "MFA setup not initiated." });
  }

  const ok = speakeasy.totp.verify({
    secret: mfaSecret.secret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!ok) {
    return res.status(400).json({ error: "Invalid MFA token." });
  }

  await prisma.mfaSecret.update({
    where: { userId: req.user.id },
    data: { verified: true },
  });

  res.json({ ok: true });
});

router.post("/mfa/disable", authenticate, async (req, res) => {
  await prisma.mfaSecret.deleteMany({ where: { userId: req.user.id } });
  res.json({ ok: true });
});

router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { profile: true, mfaSecret: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  res.json({ user: sanitizeUser(user) });
});

export default router;
