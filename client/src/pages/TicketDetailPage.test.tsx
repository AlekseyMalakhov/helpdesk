import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter, Routes, Route } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import TicketDetailPage from './TicketDetailPage'

vi.mock('axios')

// Radix Select doesn't open in jsdom (relies on PointerEvents). Replace with
// a native <select> so we can drive it with userEvent.selectOptions().
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value ?? ''} onChange={(e: any) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}))

const mockedAxios = vi.mocked(axios)

const AGENTS = [
  { id: 'agent-1', name: 'Alice Agent' },
  { id: 'agent-2', name: 'Bob Agent' },
]

const makeTicket = (assignedAgent: { id: string; name: string } | null = null) => ({
  id: 1,
  subject: 'Test ticket',
  body: 'Ticket body',
  senderEmail: 'user@example.com',
  senderName: 'Test User',
  status: 'open',
  category: null,
  assignedAgent,
  aiSummary: null,
  replies: [],
  createdAt: '2024-01-01T00:00:00.000Z',
})

function setupGetMocks(ticket = makeTicket()) {
  mockedAxios.get = vi.fn().mockImplementation((url: string) => {
    if (url.startsWith('/api/tickets/')) return Promise.resolve({ data: ticket })
    if (url === '/api/users/agents') return Promise.resolve({ data: AGENTS })
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function renderPage() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/tickets/1']}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('TicketDetailPage — agent assignment', () => {
  it('shows Unassigned in the agent select when ticket has no assigned agent', async () => {
    setupGetMocks(makeTicket(null))
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))
    expect(screen.getByDisplayValue('Unassigned')).toBeInTheDocument()
  })

  it('shows the assigned agent name in the agent select', async () => {
    setupGetMocks(makeTicket({ id: 'agent-1', name: 'Alice Agent' }))
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))
    expect(screen.getByDisplayValue('Alice Agent')).toBeInTheDocument()
  })

  it('Save button is disabled when there are no changes', async () => {
    setupGetMocks()
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Save button becomes enabled after selecting a different agent', async () => {
    setupGetMocks(makeTicket(null))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))

    await user.selectOptions(screen.getByDisplayValue('Unassigned'), 'Alice Agent')

    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })

  it('PATCH is called with assignedAgentId when assigning an agent', async () => {
    setupGetMocks(makeTicket(null))
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))

    await user.selectOptions(screen.getByDisplayValue('Unassigned'), 'Alice Agent')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/1',
        { assignedAgentId: 'agent-1' },
        { withCredentials: true },
      ),
    )
  })

  it('PATCH is called with assignedAgentId: null when unassigning', async () => {
    setupGetMocks(makeTicket({ id: 'agent-1', name: 'Alice Agent' }))
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))

    await user.selectOptions(screen.getByDisplayValue('Alice Agent'), 'Unassigned')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/1',
        { assignedAgentId: null },
        { withCredentials: true },
      ),
    )
  })

  it('Save button goes back to disabled after a successful save', async () => {
    setupGetMocks(makeTicket(null))
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Test ticket'))

    await user.selectOptions(screen.getByDisplayValue('Unassigned'), 'Alice Agent')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    )
  })
})
