import { Router } from "express";
import prisma from "../prisma/client";
import { inboundEmailSchema } from "@helpdesk/core";

const router = Router();

router.post("/inbound-email", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result = inboundEmailSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const { subject, body, senderEmail, senderName } = result.data;

  const ticket = await prisma.ticket.create({
    data: { subject, body, senderEmail, senderName },
  });

  res.status(201).json({ id: ticket.id });
});

export default router;
