import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { type SortingState } from '@tanstack/react-table'
import TicketsTable, { type TicketRow } from '@/components/TicketsTable'

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])

  const { data: tickets, isPending, isError } = useQuery<TicketRow[]>({
    queryKey: ['tickets', sorting],
    queryFn: () => {
      const sort = sorting[0]
      const params = sort
        ? { sortBy: sort.id, sortOrder: sort.desc ? 'desc' : 'asc' }
        : {}
      return axios
        .get('/api/tickets', { params, withCredentials: true })
        .then((r) => r.data)
    },
  })

  if (isPending) return <p className="p-6 text-sm text-gray-500">Loading tickets…</p>
  if (isError) return <p className="p-6 text-sm text-red-500">Failed to load tickets.</p>

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tickets</h1>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-500">No tickets yet.</p>
      ) : (
        <TicketsTable tickets={tickets} sorting={sorting} onSortingChange={setSorting} />
      )}
    </div>
  )
}
