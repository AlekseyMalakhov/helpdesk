import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TicketStatus, TicketCategory } from '@helpdesk/core'
import { statusVariant, categoryLabel } from '@/lib/tickets'

interface Reply {
  id: string
  body: string
  createdAt: string
}

interface Ticket {
  id: number
  subject: string
  body: string
  senderEmail: string
  senderName: string
  status: TicketStatus
  category: TicketCategory | null
  aiSummary: string | null
  replies: Reply[]
  createdAt: string
}


export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: ticket, isPending, isError } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios.get(`/api/tickets/${id}`, { withCredentials: true }).then((r) => r.data),
  })

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('')

  const mutation = useMutation({
    mutationFn: (status: TicketStatus) =>
      axios.patch(`/api/tickets/${id}`, { status }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedStatus('')
    },
  })

  if (isPending) return <p className="p-6 text-sm text-gray-500">Loading…</p>
  if (isError) return <p className="p-6 text-sm text-red-500">Failed to load ticket.</p>

  const currentStatus = selectedStatus || ticket.status

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

      <div className="flex items-center gap-3">
        <Select
          value={currentStatus}
          onValueChange={(v) => setSelectedStatus(v as TicketStatus)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!selectedStatus || selectedStatus === ticket.status || mutation.isPending}
          onClick={() => selectedStatus && mutation.mutate(selectedStatus as TicketStatus)}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
