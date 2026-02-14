import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL_SECONDS = parseInt(process.env.ACCESS_TOKEN_TTL ?? "900", 10);
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? "30", 10);
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
  console.warn("JWT_ACCESS_SECRET is not defined. Set it in your environment for secure tokens.");
}

export function generateAccessToken(user) {
  if (!JWT_ACCESS_SECRET) {
    throw new Error("JWT access secret missing");
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    }
  );
}

export function verifyAccessToken(token) {
  if (!JWT_ACCESS_SECRET) {
    throw new Error("JWT access secret missing");
  }

  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function generateRefreshToken() {
  const token = crypto.randomBytes(64).toString("hex");
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, hashedToken, expiresAt };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function setRefreshTokenCookie(res, token) {
  const cookieName = process.env.REFRESH_TOKEN_COOKIE_NAME ?? "refreshToken";
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(res) {
  const cookieName = process.env.REFRESH_TOKEN_COOKIE_NAME ?? "refreshToken";
  res.clearCookie(cookieName, { httpOnly: true, path: "/" });
}

export function getRefreshTokenFromRequest(req) {
  const cookieName = process.env.REFRESH_TOKEN_COOKIE_NAME ?? "refreshToken";
  return req.cookies?.[cookieName] ?? null;
}

export function accessTokenTtlSeconds() {
  return ACCESS_TOKEN_TTL_SECONDS;
}
