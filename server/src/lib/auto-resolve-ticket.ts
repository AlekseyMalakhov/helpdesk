import { readFileSync } from "fs";
import { join } from "path";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import prisma from "../prisma/client";

const knowledgeBase = readFileSync(join(import.meta.dir, "../../knowledge-base.md"), "utf-8");

interface AutoResolveInput {
  id: number;
  subject: string;
  body: string;
  senderName: string;
}

export async function autoResolveTicket({ id, subject, body, senderName }: AutoResolveInput): Promise<void> {
  let text: string;
  try {
    ({ text } = await generateText({
    model: openai("gpt-5-nano"),
    system: `You are a customer support AI for Code with Mosh. Using ONLY the knowledge base below, determine if you can fully resolve the customer's support ticket.

If you can fully answer it, write a complete, professional reply addressed to the customer by name. Sign off as "Code with Mosh Support Team".

If ANY of the following apply, respond with exactly the single word ESCALATE and nothing else:
- The issue involves a legal threat or chargeback dispute
- The customer requests a refund and may be outside the 30-day window (when in doubt, escalate)
- The issue involves account security concerns
- The knowledge base does not cover the issue
- You are not confident your answer fully resolves the ticket

Knowledge Base:
${knowledgeBase}`,
    prompt: `Customer name: ${senderName}
Subject: ${subject}
Message:
${body}`,
    }));
  } catch {
    await prisma.ticket.update({ where: { id }, data: { status: "open" } });
    return;
  }

  if (text.trim() === "ESCALATE") {
    await prisma.ticket.update({ where: { id }, data: { status: "open" } });
    return;
  }

  await prisma.$transaction([
    prisma.reply.create({
      data: { ticketId: id, body: text.trim(), senderType: "agent" },
    }),
    prisma.ticket.update({
      where: { id },
      data: { status: "resolved", resolvedByAi: true },
    }),
  ]);
}
