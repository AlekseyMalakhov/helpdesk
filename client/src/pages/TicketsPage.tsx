import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import TicketsTable, { type TicketRow } from '@/components/TicketsTable'

export default function TicketsPage() {
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
        <TicketsTable tickets={tickets} />
      )}
    </div>
  )
}
