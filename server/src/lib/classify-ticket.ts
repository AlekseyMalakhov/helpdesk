import { type Ticket } from "@prisma/client";
import boss from "./boss";

export const CLASSIFY_TICKET_QUEUE = "classify-ticket";

export type ClassifyTicketData = Pick<Ticket, "id" | "subject" | "body">;

export async function classifyTicket(ticket: ClassifyTicketData): Promise<void> {
  await boss.send(CLASSIFY_TICKET_QUEUE, ticket);
}
