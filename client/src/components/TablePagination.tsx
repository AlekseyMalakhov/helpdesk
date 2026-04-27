import { Button } from '@/components/ui/button'

interface Props {
  from: number
  to: number
  rowCount: number
  pageIndex: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
}

export default function TablePagination({
  from,
  to,
  rowCount,
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}: Props) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600">
      <span>
        {rowCount === 0 ? 'No results' : `${from}–${to} of ${rowCount}`}
      </span>
      <div className="flex items-center gap-2">
        <span>
          Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
