import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { createReplySchema, type CreateReply } from '@helpdesk/core'
import { type Ticket } from '@/components/TicketControls'

export default function TicketReplies({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient()
  const ticketId = String(ticket.id)

  const form = useForm<CreateReply>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: CreateReply) =>
      axios.post(`/api/tickets/${ticketId}/replies`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      form.reset()
    },
  })

  const polishMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await axios.post<{ body: string }>(
        `/api/tickets/${ticketId}/polish-reply`,
        { body },
        { withCredentials: true },
      )
      return res.data.body
    },
    onSuccess: (polishedBody) => {
      form.setValue('body', polishedBody, { shouldValidate: true })
    },
  })

  return (
    <div className="border-t pt-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Replies {ticket.replies.length > 0 && `(${ticket.replies.length})`}
      </h2>

      {ticket.replies.length === 0 && (
        <p className="text-sm text-gray-400 mb-6">No replies yet.</p>
      )}

      <div className="space-y-4 mb-6">
        {ticket.replies.map((reply) => (
          <div
            key={reply.id}
            className={`rounded-md border p-4 ${reply.senderType === 'agent' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium ${reply.senderType === 'agent' ? 'text-blue-600' : 'text-gray-500'}`}>
                {reply.senderType === 'agent' ? 'Agent' : 'Customer'}
              </span>
              <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-3"
        >
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Write a reply…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={polishMutation.isPending || !form.watch('body').trim()}
              onClick={() => polishMutation.mutate(form.getValues('body'))}
            >
              {polishMutation.isPending ? 'Polishing…' : 'Polish'}
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending || !form.watch('body').trim()}>
              {mutation.isPending ? 'Sending…' : 'Send reply'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
