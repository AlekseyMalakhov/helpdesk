import { Router } from "express";
import { randomBytes, scrypt } from "node:crypto";
import { createUserSchema, editUserBodySchema } from "@helpdesk/core";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import prisma from "../prisma/client";

function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(
      plain.normalize("NFKC"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => {
        if (err) reject(err);
        else resolve(`${salt}:${key.toString("hex")}`);
      },
    );
  });
}

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    const error = firstIssue(result.error);
    return res.status(400).json({ error });
  }
  const { name, email, password } = result.data;

  const hashed = await hashPassword(password);
  const userId = crypto.randomUUID();

  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email,
        emailVerified: false,
        role: "agent",
      },
    });
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
      },
    });
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (e: any) {
    if (e.code === "P2002")
      return res.status(409).json({ error: "Email already in use." });
    throw e;
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const result = editUserBodySchema.safeParse(req.body);
  if (!result.success) {
    const error = firstIssue(result.error);
    return res.status(400).json({ error });
  }
  const { name, email, password } = result.data;
  const { id } = req.params as { id: string };

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name: name.trim(), email },
    });
    if (password) {
      const hashed = await hashPassword(password);
      await prisma.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashed },
      });
    }
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (e: any) {
    if (e.code === "P2025") return res.status(404).json({ error: "User not found." });
    if (e.code === "P2002") return res.status(409).json({ error: "Email already in use." });
    throw e;
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) return res.status(404).json({ error: "User not found." });
  if (user.role === "admin") return res.status(403).json({ error: "Admin users cannot be deleted." });

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);
  return res.status(204).send();
});

export default router;
