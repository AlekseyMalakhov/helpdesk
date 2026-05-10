import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import prisma from "../prisma/client";
import boss from "./boss";
import { CLASSIFY_TICKET_QUEUE, type ClassifyTicketData } from "./classify-ticket";
import { autoResolveTicket } from "./auto-resolve-ticket";

const CATEGORIES = ["general_question", "technical_question", "refund_request"] as const;
type Category = (typeof CATEGORIES)[number];

export async function registerWorkers(): Promise<void> {
  await boss.createQueue(CLASSIFY_TICKET_QUEUE);
  await boss.work<ClassifyTicketData>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    const { id, subject, body } = job.data;

    const { text } = await generateText({
      model: openai("gpt-5-nano"),
      prompt: `Classify this support ticket. Reply with exactly one of these values and nothing else:
general_question
technical_question
refund_request

Definitions:
- general_question: general inquiries, account help, how-to questions (e.g. changing a password, updating profile, navigating the UI)
- technical_question: software bugs, errors, crashes, or unexpected behavior in the product
- refund_request: refund, return, or money-back requests

Subject: ${subject}
Body: ${body}`,
    });

    const category = text.trim() as Category;
    if (CATEGORIES.includes(category)) {
      await prisma.ticket.update({ where: { id }, data: { category } });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { senderName: true } });
    if (ticket) {
      await autoResolveTicket({ id, subject, body, senderName: ticket.senderName });
    }
  });
}
