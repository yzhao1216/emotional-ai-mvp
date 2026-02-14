import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user.id },
  });

  res.json({
    profile: {
      name: profile?.name ?? "",
      language: profile?.language ?? "en",
    },
  });
});

router.put("/", async (req, res) => {
  const { name, language } = req.body ?? {};

  const updated = await prisma.profile.upsert({
    where: { userId: req.user.id },
    create: {
      userId: req.user.id,
      name: name?.trim() || null,
      language: language?.trim() || "en",
    },
    update: {
      name: name?.trim() || null,
      language: language?.trim() || "en",
    },
  });

  res.json({
    profile: {
      name: updated.name ?? "",
      language: updated.language ?? "en",
    },
  });
});

export default router;
