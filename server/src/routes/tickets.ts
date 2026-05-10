import { Router } from "express";
import { type Prisma } from "@prisma/client";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import prisma from "../prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { updateTicketSchema, ticketStatusSchema, ticketCategorySchema, createReplySchema } from "@helpdesk/core";
import { z } from "zod";

const router = Router();

function parseTicketId(params: unknown): number | null {
  const id = parseInt((params as { id: string }).id, 10);
  return isNaN(id) ? null : id;
}

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

  const where: Prisma.TicketWhereInput = { status: { not: "processing" } };

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
  const id = parseTicketId(req.params);
  if (id === null) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
      assignedAgent: { select: { id: true, name: true } },
    },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  res.json(ticket);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseTicketId(req.params);
  if (id === null) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }
  const result = updateTicketSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  if (result.data.assignedAgentId) {
    const agent = await prisma.user.findUnique({ where: { id: result.data.assignedAgentId } });
    if (!agent || agent.role !== "agent" || agent.deletedAt !== null) {
      res.status(400).json({ error: "Invalid agent." });
      return;
    }
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

router.post("/:id/polish-reply", requireAuth, async (req, res) => {
  const id = parseTicketId(req.params);
  if (id === null) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }

  const result = z.object({ body: z.string().min(1, "Reply body is required.") }).safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { senderName: true } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const agent = res.locals.session.user;
  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      `You are a professional customer support writing assistant. Improve the following agent reply to be clearer, more professional, and more helpful while preserving the original intent. Address the customer by their name "${ticket.senderName}". Sign the reply with the agent's name "${agent.name}" and email "${agent.email}". Return only the improved reply text with no additional commentary.`,
    prompt: result.data.body,
  });

  res.json({ body: text });
});

router.post("/:id/summarize", requireAuth, async (req, res) => {
  const id = parseTicketId(req.params);
  if (id === null) {
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

  const parts = [
    `Original message from ${ticket.senderName}:\n${ticket.body}`,
    ...ticket.replies.map(
      (r) => `${r.senderType === "agent" ? "Agent" : "Customer"} reply:\n${r.body}`
    ),
  ];

  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You are a concise customer support assistant. Summarize the following support ticket conversation in 2-4 sentences, covering the main issue, any steps taken, and the current resolution status. Return only the summary with no additional commentary.",
    prompt: parts.join("\n\n"),
  });

  const updated = await prisma.ticket.update({
    where: { id },
    data: { aiSummary: text },
  });

  res.json({ summary: updated.aiSummary });
});

router.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseTicketId(req.params);
  if (id === null) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }

  const result = createReplySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const reply = await prisma.reply.create({
    data: { ticketId: id, body: result.data.body },
  });

  res.status(201).json(reply);
});

export default router;
