import { verifyAccessToken } from "../utils/tokens.js";
import prisma from "../prisma.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, mfaSecret: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      profile: user.profile,
      hasMfaEnabled: Boolean(user.mfaSecret?.verified),
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
