import { useNavigate } from 'react-router'
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
import { statusVariant, categoryLabel } from '@/lib/tickets'

export interface TicketRow {
  id: number
  subject: string
  senderEmail: string
  senderName: string
  status: TicketStatus
  category: TicketCategory | null
  createdAt: string
}

export default function TicketsTable({ tickets }: { tickets: TicketRow[] }) {
  const navigate = useNavigate()

  return (
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
  )
}
