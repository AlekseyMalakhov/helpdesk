import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import TicketReplies from './TicketReplies'
import type { Ticket } from './TicketControls'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 1,
  subject: 'Test ticket',
  body: 'Ticket body',
  senderEmail: 'customer@example.com',
  senderName: 'Test Customer',
  status: 'open',
  category: null,
  assignedAgent: null,
  aiSummary: null,
  replies: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

function renderReplies(ticket = makeTicket()) {
  return renderWithProviders(<TicketReplies ticket={ticket} />)
}

beforeEach(() => vi.resetAllMocks())

describe('TicketReplies — Polish button state', () => {
  it('is disabled when the textarea is empty', async () => {
    renderReplies()
    expect(screen.getByRole('button', { name: 'Polish' })).toBeDisabled()
  })

  it('is disabled when the textarea contains only whitespace', async () => {
    const user = userEvent.setup()
    renderReplies()
    await user.type(screen.getByPlaceholderText('Write a reply…'), '   ')
    expect(screen.getByRole('button', { name: 'Polish' })).toBeDisabled()
  })

  it('becomes enabled once the textarea has non-whitespace text', async () => {
    const user = userEvent.setup()
    renderReplies()
    await user.type(screen.getByPlaceholderText('Write a reply…'), 'Hello')
    expect(screen.getByRole('button', { name: 'Polish' })).not.toBeDisabled()
  })
})

describe('TicketReplies — Polish button request', () => {
  it('POSTs to /api/tickets/:id/polish-reply with the current body', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { body: 'Polished reply' } })
    const user = userEvent.setup()
    renderReplies()

    await user.type(screen.getByPlaceholderText('Write a reply…'), 'rough draft')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/tickets/1/polish-reply',
        { body: 'rough draft' },
        { withCredentials: true },
      ),
    )
  })

  it('replaces the textarea value with the polished text on success', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { body: 'Polished reply' } })
    const user = userEvent.setup()
    renderReplies()

    await user.type(screen.getByPlaceholderText('Write a reply…'), 'rough draft')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Write a reply…')).toHaveValue('Polished reply'),
    )
  })

  it('shows "Polishing…" and disables the button while the request is in flight', async () => {
    let resolvePost!: (v: unknown) => void
    mockedAxios.post = vi.fn().mockReturnValue(new Promise((r) => { resolvePost = r }))
    const user = userEvent.setup()
    renderReplies()

    await user.type(screen.getByPlaceholderText('Write a reply…'), 'rough draft')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    const polishingBtn = await screen.findByRole('button', { name: 'Polishing…' })
    expect(polishingBtn).toBeDisabled()

    resolvePost({ data: { body: 'done' } })
  })

  it('restores the Polish button after the request completes', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { body: 'Polished reply' } })
    const user = userEvent.setup()
    renderReplies()

    await user.type(screen.getByPlaceholderText('Write a reply…'), 'rough draft')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Polish' })).toBeInTheDocument(),
    )
  })
})

describe('TicketReplies — Send reply button state', () => {
  it('is disabled when the textarea is empty', async () => {
    renderReplies()
    expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled()
  })

  it('is disabled when the textarea contains only whitespace', async () => {
    const user = userEvent.setup()
    renderReplies()
    await user.type(screen.getByPlaceholderText('Write a reply…'), '   ')
    expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled()
  })

  it('becomes enabled once the textarea has non-whitespace text', async () => {
    const user = userEvent.setup()
    renderReplies()
    await user.type(screen.getByPlaceholderText('Write a reply…'), 'Hello')
    expect(screen.getByRole('button', { name: 'Send reply' })).not.toBeDisabled()
  })

  it('is enabled after polishing (polished text counts as non-empty)', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { body: 'Polished reply' } })
    const user = userEvent.setup()
    renderReplies()

    await user.type(screen.getByPlaceholderText('Write a reply…'), 'rough draft')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send reply' })).not.toBeDisabled(),
    )
  })
})
