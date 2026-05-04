import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type TicketStatus, type TicketCategory } from '@helpdesk/core'
import { categoryLabel } from '@/lib/tickets'

export interface Agent {
  id: string
  name: string
}

export interface Ticket {
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

export interface Reply {
  id: string
  body: string
  senderType: 'agent' | 'customer'
  createdAt: string
}

const UNASSIGNED = '__unassigned__'

export default function TicketControls({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient()
  const ticketId = String(ticket.id)

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () =>
      axios.get('/api/users/agents', { withCredentials: true }).then((r) => r.data),
  })

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('')
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | ''>('')
  // undefined = no pending change; null = unassign; string = assign to agent id
  const [selectedAgentId, setSelectedAgentId] = useState<string | null | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: (data: { status?: TicketStatus; category?: TicketCategory; assignedAgentId?: string | null }) =>
      axios.patch(`/api/tickets/${ticketId}`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedStatus('')
      setSelectedCategory('')
      setSelectedAgentId(undefined)
    },
  })

  const currentStatus = selectedStatus || ticket.status
  const currentCategory = selectedCategory || ticket.category || ''

  const hasStatusChange = selectedStatus !== '' && selectedStatus !== ticket.status
  const hasCategoryChange = selectedCategory !== '' && selectedCategory !== ticket.category
  const hasAgentChange =
    selectedAgentId !== undefined &&
    selectedAgentId !== (ticket.assignedAgent?.id ?? null)

  const handleSave = () => {
    const data: { status?: TicketStatus; category?: TicketCategory; assignedAgentId?: string | null } = {}
    if (hasStatusChange) data.status = selectedStatus as TicketStatus
    if (hasCategoryChange) data.category = selectedCategory as TicketCategory
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
    <div className="flex flex-wrap items-center gap-3 mb-8">
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

      <Select value={currentCategory} onValueChange={(v) => setSelectedCategory(v as TicketCategory)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Set category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general_question">{categoryLabel.general_question}</SelectItem>
          <SelectItem value="technical_question">{categoryLabel.technical_question}</SelectItem>
          <SelectItem value="refund_request">{categoryLabel.refund_request}</SelectItem>
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
        disabled={(!hasStatusChange && !hasCategoryChange && !hasAgentChange) || mutation.isPending}
        onClick={handleSave}
      >
        {mutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}
