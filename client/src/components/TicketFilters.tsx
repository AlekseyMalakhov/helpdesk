import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { categoryLabel } from '@/lib/tickets'

export interface TicketFilterState {
  status: string
  category: string
  search: string
}

interface Props {
  filters: TicketFilterState
  onChange: (filters: TicketFilterState) => void
}

export default function TicketFilters({ filters, onChange }: Props) {
  const set = (patch: Partial<TicketFilterState>) =>
    onChange({ ...filters, ...patch })

  const isActive =
    filters.status !== '' || filters.category !== '' || filters.search !== ''

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Input
        placeholder="Search subject or sender…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        className="w-64"
      />

      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => set({ status: v === 'all' ? '' : v })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category || 'all'}
        onValueChange={(v) => set({ category: v === 'all' ? '' : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {(Object.entries(categoryLabel) as [string, string][]).map(
            ([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      {isActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ status: '', category: '', search: '' })}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
