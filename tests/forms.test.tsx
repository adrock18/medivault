// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import AuthPage from '../src/pages/AuthPage'
import { MedicationForm } from '../src/components/MedicationForm'
import { HealthMetricForm } from '../src/components/HealthMetricForm'
import { UploadDialog } from '../src/components/UploadDialog'
import { ConfirmationDialog, FormDialog } from '../src/components/common'
const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  medication: vi.fn(),
  metric: vi.fn(),
  reload: vi.fn(async () => {}),
}))
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
    error: null,
    signIn: mocks.login,
    signUp: mocks.signup,
  }),
}))
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => ({ now: new Date(), reload: mocks.reload }),
}))
vi.mock('../src/lib/api', () => ({
  errorMessage: (error: Error) => error.message,
  api: {
    medications: { save: mocks.medication },
    metrics: { save: mocks.metric },
  },
}))
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}
describe('Express-connected forms', () => {
  it('validates login input and surfaces the server authentication error', async () => {
    mocks.login.mockRejectedValue(new Error('Invalid email or password.'))
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }))
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument()
    expect(mocks.login).not.toHaveBeenCalled()
    fill('Email address', 'alex@example.com')
    fill('Password', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    )
    expect(mocks.login).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'password123',
    })
    expect(screen.getByLabelText('Email address')).toHaveValue(
      'alex@example.com',
    )
    expect(screen.getByLabelText('Password')).toHaveValue('password123')
  })
  it('keeps a pending dialog open and removes its dismissal actions', () => {
    const close = vi.fn()
    const { rerender } = render(
      <FormDialog
        open
        title="Save record"
        description="Record details"
        onClose={close}
      >
        Content
      </FormDialog>,
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    rerender(
      <FormDialog
        open
        busy
        title="Save record"
        description="Record details"
        onClose={close}
      >
        Content
      </FormDialog>,
    )
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(close).not.toHaveBeenCalled()
  })
  it('cancels deletion without submitting and locks actions while pending', () => {
    const close = vi.fn()
    const confirm = vi.fn()
    const { rerender } = render(
      <ConfirmationDialog
        open
        title="Delete record?"
        description="This removes the file."
        busy={false}
        onClose={close}
        onConfirm={confirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalledOnce()
    expect(confirm).not.toHaveBeenCalled()
    rerender(
      <ConfirmationDialog
        open
        title="Delete record?"
        description="This removes the file."
        busy
        onClose={close}
        onConfirm={confirm}
      />,
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /Delete permanently/ }),
    ).toBeDisabled()
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-busy', 'true')
  })
  it('submits validated registration to Express without requiring an email confirmation service', async () => {
    mocks.signup.mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <AuthPage registration />
      </MemoryRouter>,
    )
    fill('Full name', 'Alex Morgan')
    fill('Email address', 'alex@example.com')
    fill('Password', 'password123')
    fill('Confirm password', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }))
    await waitFor(() =>
      expect(mocks.signup).toHaveBeenCalledWith({
        full_name: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'password123',
        confirm_password: 'password123',
      }),
    )
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
  })
  it('rejects duplicate dose times before saving, then submits a valid schedule without a client-selected owner', async () => {
    const close = vi.fn()
    mocks.medication.mockResolvedValue(undefined)
    render(<MedicationForm onClose={close} />)
    fill('Medicine name *', 'Example medication')
    fill('Prescribed dosage *', 'As prescribed')
    fill('Frequency *', 'twice_daily')
    fill('Dose times *', '08:00, 08:00')
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }))
    expect(
      await screen.findByText(/Enter up to 12 unique times/),
    ).toBeInTheDocument()
    expect(mocks.medication).not.toHaveBeenCalled()
    fill('Dose times *', '20:00, 08:00')
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(mocks.medication).toHaveBeenCalledWith(
      expect.objectContaining({ times: '20:00, 08:00', end_date: '' }),
      undefined,
    )
    expect(mocks.medication.mock.calls[0][0]).not.toHaveProperty('user_id')
  })
  it('sends a validated measurement to Express for server-side numeric and timestamp conversion', async () => {
    const close = vi.fn()
    mocks.metric.mockResolvedValue(undefined)
    render(<HealthMetricForm onClose={close} />)
    fill('Measurement type *', 'weight')
    fill('Value (kg) *', '72.4')
    fill('Date and time *', '2025-01-01T08:30')
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(mocks.metric).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'weight',
        value: '72.4',
        secondary_value: '',
        measured_at: '2025-01-01T08:30',
      }),
      undefined,
    )
  })
  it('requires a selected document before an upload request', async () => {
    render(<UploadDialog onClose={vi.fn()} />)
    fill('Document title *', 'Test report')
    fireEvent.click(screen.getByRole('button', { name: 'Upload document' }))
    expect(
      await screen.findByText('Choose a PDF, JPG, or PNG document.'),
    ).toBeInTheDocument()
  })
})
