import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { type Ticket } from "@prisma/client";
import prisma from "../prisma/client";

const CATEGORIES = ["general_question", "technical_question", "refund_request"] as const;
type Category = (typeof CATEGORIES)[number];

export function classifyTicket(ticket: Pick<Ticket, "id" | "subject" | "body">): void {
  generateText({
    model: openai("gpt-5-nano"),
    prompt: `Classify this support ticket. Reply with exactly one of these values and nothing else:
general_question
technical_question
refund_request

Definitions:
- general_question: general inquiries, account help, how-to questions (e.g. changing a password, updating profile, navigating the UI)
- technical_question: software bugs, errors, crashes, or unexpected behavior in the product
- refund_request: refund, return, or money-back requests

Subject: ${ticket.subject}
Body: ${ticket.body}`,
  })
    .then(({ text }) => {
      const category = text.trim() as Category;
      if (CATEGORIES.includes(category)) {
        return prisma.ticket.update({ where: { id: ticket.id }, data: { category } });
      }
    })
    .catch(() => {
      // Classification failure is non-critical — ticket stays uncategorized
    });
}
