import { useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { statusVariant, categoryLabel } from '@/lib/tickets'
import TicketControls, { type Ticket } from '@/components/TicketControls'
import TicketReplies from '@/components/TicketReplies'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: ticket, isPending, isError } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios.get(`/api/tickets/${id}`, { withCredentials: true }).then((r) => r.data),
  })

  const summarizeMutation = useMutation({
    mutationFn: () =>
      axios
        .post<{ summary: string }>(`/api/tickets/${id}/summarize`, {}, { withCredentials: true })
        .then((r) => r.data.summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })

  if (isPending) return <p className="p-6 text-sm text-gray-500">Loading…</p>
  if (isError) return <p className="p-6 text-sm text-red-500">Failed to load ticket.</p>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold">{ticket.subject}</h1>
        <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        From {ticket.senderName} &lt;{ticket.senderEmail}&gt; ·{' '}
        {new Date(ticket.createdAt).toLocaleString()}
        {ticket.category && ` · ${categoryLabel[ticket.category]}`}
      </p>

      <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap text-sm mb-3">
        {ticket.body}
      </div>

      {ticket.aiSummary && (
        <div className="rounded-md border border-purple-100 bg-purple-50 p-4 text-sm text-purple-900 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-purple-600">
            <Sparkles className="h-3.5 w-3.5" />
            AI Summary
          </div>
          {ticket.aiSummary}
        </div>
      )}

      <div className="mb-6">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={summarizeMutation.isPending}
          onClick={() => summarizeMutation.mutate()}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {summarizeMutation.isPending
            ? 'Summarizing…'
            : ticket.aiSummary
              ? 'Re-summarize'
              : 'Summarize'}
        </Button>
      </div>

      <TicketControls ticket={ticket} />
      <TicketReplies ticket={ticket} />
    </div>
  )
}
