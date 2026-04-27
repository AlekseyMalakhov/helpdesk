import { Router } from "express";
import { type Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { updateTicketSchema, ticketStatusSchema, ticketCategorySchema } from "@helpdesk/core";

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
  const { sortBy, sortOrder, status, category, search } = req.query as {
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    category?: string;
    search?: string;
  };

  const col: SortableColumn = SORTABLE_COLUMNS.includes(
    sortBy as SortableColumn,
  )
    ? (sortBy as SortableColumn)
    : "createdAt";
  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

  const where: Prisma.TicketWhereInput = {};

  const statusParsed = ticketStatusSchema.safeParse(status);
  if (statusParsed.success) where.status = statusParsed.data;

  const categoryParsed = ticketCategorySchema.safeParse(category);
  if (categoryParsed.success) where.category = categoryParsed.data;

  if (search?.trim()) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { senderName: { contains: search, mode: "insensitive" } },
      { senderEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [col]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        subject: true,
        senderEmail: true,
        senderName: true,
        status: true,
        category: true,
        createdAt: true,
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total });
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
