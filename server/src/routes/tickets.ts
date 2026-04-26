import { Router } from "express";
import prisma from "../prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { updateTicketSchema } from "@helpdesk/core";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      senderEmail: true,
      senderName: true,
      status: true,
      category: true,
      createdAt: true,
    },
  });
  res.json(tickets);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt((req.params as { id: string }).id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  res.json(ticket);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt((req.params as { id: string }).id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }
  const result = updateTicketSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: result.data,
  });
  res.json(updated);
});

export default router;
