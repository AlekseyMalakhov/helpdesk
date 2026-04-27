import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type OnChangeFn,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import TablePagination from '@/components/TablePagination'

export interface TicketRow {
  id: number
  subject: string
  senderEmail: string
  senderName: string
  status: TicketStatus
  category: TicketCategory | null
  createdAt: string
}

interface Props {
  tickets: TicketRow[]
  rowCount: number
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

const columnHelper = createColumnHelper<TicketRow>()

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />
  if (isSorted === 'desc') return <ArrowDown className="ml-1 inline h-3 w-3" />
  return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />
}

export default function TicketsTable({
  tickets,
  rowCount,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
}: Props) {
  const navigate = useNavigate()

  const columns = useMemo(
    () => [
      columnHelper.accessor('subject', {
        header: 'Subject',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('senderName', {
        header: 'Sender',
        cell: (info) => (
          <span className="text-sm text-gray-600">
            {info.getValue()} &lt;{info.row.original.senderEmail}&gt;
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={statusVariant[info.getValue()]}>{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => {
          const val = info.getValue()
          return (
            <span className="text-sm text-gray-600">
              {val ? categoryLabel[val] : '—'}
            </span>
          )
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => (
          <span className="text-sm text-gray-500">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: tickets,
    columns,
    rowCount,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, rowCount)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  <SortIcon isSorted={header.column.getIsSorted()} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/tickets/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        from={from}
        to={to}
        rowCount={rowCount}
        pageIndex={pageIndex}
        pageCount={pageCount}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
      />
    </div>
  )
}
