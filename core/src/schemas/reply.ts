import { z } from 'zod'

export const createReplySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty.'),
})

export type CreateReply = z.infer<typeof createReplySchema>
