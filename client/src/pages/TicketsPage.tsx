import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { type SortingState, type PaginationState, type OnChangeFn } from '@tanstack/react-table'
import TicketsTable, { type TicketRow } from '@/components/TicketsTable'
import TicketFilters, { type TicketFilterState } from '@/components/TicketFilters'

interface TicketsResponse {
  tickets: TicketRow[]
  total: number
}

const DEFAULT_FILTERS: TicketFilterState = { status: '', category: '', search: '' }
const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 25 }

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [filters, setFilters] = useState<TicketFilterState>(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION)

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater)
    resetPage()
  }

  const handleFiltersChange = (next: TicketFilterState) => {
    setFilters(next)
    resetPage()
  }

  const { data, isPending, isError } = useQuery<TicketsResponse>({
    queryKey: ['tickets', sorting, filters, pagination],
    queryFn: () => {
      const sort = sorting[0]
      const params: Record<string, string | number> = {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }
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
    if (data.total === 0)
      return (
        <p className="text-sm text-gray-500">
          {hasActiveFilter ? 'No tickets match your filters.' : 'No tickets yet.'}
        </p>
      )
    return (
      <TicketsTable
        tickets={data.tickets}
        rowCount={data.total}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tickets</h1>
      <TicketFilters filters={filters} onChange={handleFiltersChange} />
      {renderTable()}
    </div>
  )
}
