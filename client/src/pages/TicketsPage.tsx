import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import axios from 'axios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { TicketStatus, TicketCategory } from '@helpdesk/core'

interface TicketRow {
  id: number
  subject: string
  senderEmail: string
  senderName: string
  status: TicketStatus
  category: TicketCategory | null
  createdAt: string
}

const statusVariant: Record<TicketStatus, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  resolved: 'secondary',
  closed: 'outline',
}

const categoryLabel: Record<TicketCategory, string> = {
  general_question: 'General',
  technical_question: 'Technical',
  refund_request: 'Refund',
}

export default function TicketsPage() {
  const navigate = useNavigate()
  const { data: tickets, isPending, isError } = useQuery<TicketRow[]>({
    queryKey: ['tickets'],
    queryFn: () =>
      axios.get('/api/tickets', { withCredentials: true }).then((r) => r.data),
  })

  if (isPending) return <p className="p-6 text-sm text-gray-500">Loading tickets…</p>
  if (isError) return <p className="p-6 text-sm text-red-500">Failed to load tickets.</p>

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tickets</h1>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-500">No tickets yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  <TableCell className="font-medium">{t.subject}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {t.senderName} &lt;{t.senderEmail}&gt;
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {t.category ? categoryLabel[t.category] : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
