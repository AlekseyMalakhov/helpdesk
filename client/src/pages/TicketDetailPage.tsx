import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { statusVariant, categoryLabel } from '@/lib/tickets'
import TicketControls, { type Ticket } from '@/components/TicketControls'
import TicketReplies from '@/components/TicketReplies'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: ticket, isPending, isError } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios.get(`/api/tickets/${id}`, { withCredentials: true }).then((r) => r.data),
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

      <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap text-sm mb-6">
        {ticket.body}
      </div>

      <TicketControls ticket={ticket} />
      <TicketReplies ticket={ticket} />
    </div>
  )
}
