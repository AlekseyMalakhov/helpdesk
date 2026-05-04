import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { createReplySchema, type CreateReply, type TicketStatus, type TicketCategory } from '@helpdesk/core'
import { statusVariant, categoryLabel } from '@/lib/tickets'

interface Reply {
  id: string
  body: string
  senderType: 'agent' | 'customer'
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
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | ''>('')
  // undefined = no pending change; null = unassign; string = assign to agent id
  const [selectedAgentId, setSelectedAgentId] = useState<string | null | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: (data: { status?: TicketStatus; category?: TicketCategory; assignedAgentId?: string | null }) =>
      axios.patch(`/api/tickets/${id}`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedStatus('')
      setSelectedCategory('')
      setSelectedAgentId(undefined)
    },
  })

  const replyForm = useForm<CreateReply>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: '' },
  })

  const replyMutation = useMutation({
    mutationFn: (data: CreateReply) =>
      axios.post(`/api/tickets/${id}/replies`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      replyForm.reset()
    },
  })

  if (isPending) return <p className="p-6 text-sm text-gray-500">Loading…</p>
  if (isError) return <p className="p-6 text-sm text-red-500">Failed to load ticket.</p>

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

        <Form {...replyForm}>
          <form
            onSubmit={replyForm.handleSubmit((data) => replyMutation.mutate(data))}
            className="space-y-3"
          >
            <FormField
              control={replyForm.control}
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
            <Button type="submit" size="sm" disabled={replyMutation.isPending}>
              {replyMutation.isPending ? 'Sending…' : 'Send reply'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
