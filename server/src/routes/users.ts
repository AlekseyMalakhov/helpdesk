import { Router } from "express";
import { randomBytes, scrypt } from "node:crypto";
import { createUserSchema } from "@helpdesk/core";
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

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    const error = result.error.issues[0]?.message ?? "Invalid input.";
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

export default router;
