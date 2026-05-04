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

interface Agent {
  id: string
  name: string
}

interface Ticket {
  id: number
  subject: string
  body: string
  senderEmail: string
  senderName: string
  status: TicketStatus
  category: TicketCategory | null
  assignedAgent: Agent | null
  aiSummary: string | null
  replies: Reply[]
  createdAt: string
}

const UNASSIGNED = '__unassigned__'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: ticket, isPending, isError } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios.get(`/api/tickets/${id}`, { withCredentials: true }).then((r) => r.data),
  })

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () =>
      axios.get('/api/users/agents', { withCredentials: true }).then((r) => r.data),
  })

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('')
  // undefined = no pending change; null = unassign; string = assign to agent id
  const [selectedAgentId, setSelectedAgentId] = useState<string | null | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: (data: { status?: TicketStatus; assignedAgentId?: string | null }) =>
      axios.patch(`/api/tickets/${id}`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedStatus('')
      setSelectedAgentId(undefined)
    },
  })

  if (isPending) return <p className="p-6 text-sm text-gray-500">Loading…</p>
  if (isError) return <p className="p-6 text-sm text-red-500">Failed to load ticket.</p>

  const currentStatus = selectedStatus || ticket.status

  const hasStatusChange = selectedStatus !== '' && selectedStatus !== ticket.status
  const hasAgentChange =
    selectedAgentId !== undefined &&
    selectedAgentId !== (ticket.assignedAgent?.id ?? null)

  const handleSave = () => {
    const data: { status?: TicketStatus; assignedAgentId?: string | null } = {}
    if (hasStatusChange) data.status = selectedStatus as TicketStatus
    if (hasAgentChange) data.assignedAgentId = selectedAgentId
    mutation.mutate(data)
  }

  const agentSelectValue =
    selectedAgentId !== undefined
      ? (selectedAgentId ?? UNASSIGNED)
      : (ticket.assignedAgent?.id ?? UNASSIGNED)

  const handleAgentChange = (value: string) => {
    setSelectedAgentId(value === UNASSIGNED ? null : value)
  }

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

      <div className="flex flex-wrap items-center gap-3">
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

        <Select value={agentSelectValue} onValueChange={handleAgentChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Assign agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          disabled={(!hasStatusChange && !hasAgentChange) || mutation.isPending}
          onClick={handleSave}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
