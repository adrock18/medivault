// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { CommandPalette } from '../src/components/CommandPalette'

afterEach(cleanup)
function Workspace() {
  const location = useLocation()
  return (
    <>
      <CommandPalette />
      <output aria-label="Current route">
        {location.pathname + location.search}
      </output>
      <input aria-label="Other field" />
    </>
  )
}
function setup() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Workspace />
    </MemoryRouter>,
  )
}
it('guards editable targets, opens with a shortcut, resets unmatched search, and restores focus', async () => {
  setup()
  const field = screen.getByLabelText('Other field')
  fireEvent.keyDown(field, { key: 'k', ctrlKey: true })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  const trigger = screen.getByRole('button', { name: 'Search actions' })
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'k', metaKey: true })
  const search = await screen.findByLabelText('Search pages and actions')
  fireEvent.change(search, { target: { value: 'nothing-matches' } })
  expect(screen.getByText('No matching actions.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(search).toHaveValue('')
  fireEvent.keyDown(search, { key: 'Escape' })
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  await waitFor(() => expect(trigger).toHaveFocus())
})
it('does not open over another dialog', () => {
  setup()
  const modal = document.createElement('div')
  modal.setAttribute('role', 'dialog')
  document.body.append(modal)
  fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
  expect(
    screen.queryByText('Where would you like to go?'),
  ).not.toBeInTheDocument()
  modal.remove()
})
it.each([
  ['Overview', '/dashboard'],
  ['Medications', '/medications'],
  ['Medical records', '/medical-records'],
  ['Health profile', '/profile'],
  ['Settings', '/settings'],
  ['Add medication', '/medications?action=add'],
  ['Scan prescription', '/medications?action=scan'],
  ['Upload record', '/medical-records?action=upload'],
  ['Return to today', '/dashboard'],
])('closes before navigating with %s', async (name, to) => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Search actions' }))
  const input = await screen.findByLabelText('Search pages and actions')
  fireEvent.change(input, { target: { value: ` ${name.toUpperCase()} ` } })
  fireEvent.click(screen.getByRole('button', { name }))
  await waitFor(() =>
    expect(screen.getByLabelText('Current route')).toHaveTextContent(to),
  )
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
})
