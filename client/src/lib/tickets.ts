import type { TicketStatus, TicketCategory } from '@helpdesk/core'

export const statusVariant: Record<TicketStatus, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  resolved: 'secondary',
  closed: 'outline',
}

export const categoryLabel: Record<TicketCategory, string> = {
  general_question: 'General',
  technical_question: 'Technical',
  refund_request: 'Refund',
}
