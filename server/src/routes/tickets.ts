import { Router } from "express";
import prisma from "../prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { updateTicketSchema } from "@helpdesk/core";

const router = Router();

const SORTABLE_COLUMNS = [
  "subject",
  "senderName",
  "senderEmail",
  "status",
  "category",
  "createdAt",
] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

router.get("/", requireAuth, async (req, res) => {
  const { sortBy, sortOrder } = req.query as {
    sortBy?: string;
    sortOrder?: string;
  };

  const col: SortableColumn = SORTABLE_COLUMNS.includes(
    sortBy as SortableColumn,
  )
    ? (sortBy as SortableColumn)
    : "createdAt";
  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

  const tickets = await prisma.ticket.findMany({
    orderBy: { [col]: dir },
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
