import { z } from "zod";

export const ticketStatusSchema = z.enum(["open", "resolved", "closed"]);
export const ticketCategorySchema = z.enum([
  "general_question",
  "technical_question",
  "refund_request",
]);

export const inboundEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  senderEmail: z.email(),
  senderName: z.string().min(1),
});

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  category: ticketCategorySchema.optional(),
  assignedAgentId: z.string().optional(),
});

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type InboundEmail = z.infer<typeof inboundEmailSchema>;
export type UpdateTicket = z.infer<typeof updateTicketSchema>;
