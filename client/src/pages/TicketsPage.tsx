import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { type SortingState } from '@tanstack/react-table'
import TicketsTable, { type TicketRow } from '@/components/TicketsTable'
import TicketFilters, { type TicketFilterState } from '@/components/TicketFilters'

const DEFAULT_FILTERS: TicketFilterState = { status: '', category: '', search: '' }

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])
  const [filters, setFilters] = useState<TicketFilterState>(DEFAULT_FILTERS)

  const { data: tickets, isPending, isError } = useQuery<TicketRow[]>({
    queryKey: ['tickets', sorting, filters],
    queryFn: () => {
      const sort = sorting[0]
      const params: Record<string, string> = {}
      if (sort) {
        params.sortBy = sort.id
        params.sortOrder = sort.desc ? 'desc' : 'asc'
      }
      if (filters.status) params.status = filters.status
      if (filters.category) params.category = filters.category
      if (filters.search.trim()) params.search = filters.search.trim()
      return axios
        .get('/api/tickets', { params, withCredentials: true })
        .then((r) => r.data)
    },
  })

  const hasActiveFilter =
    filters.status !== '' || filters.category !== '' || filters.search !== ''

  const renderTable = () => {
    if (isPending) return <p className="text-sm text-gray-500">Loading tickets…</p>
    if (isError) return <p className="text-sm text-red-500">Failed to load tickets.</p>
    if (tickets.length === 0)
      return (
        <p className="text-sm text-gray-500">
          {hasActiveFilter ? 'No tickets match your filters.' : 'No tickets yet.'}
        </p>
      )
    return (
      <TicketsTable tickets={tickets} sorting={sorting} onSortingChange={setSorting} />
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tickets</h1>
      <TicketFilters filters={filters} onChange={setFilters} />
      {renderTable()}
    </div>
  )
}
