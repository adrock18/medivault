// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
import { UploadDialog } from '../src/components/UploadDialog'
import { ConfirmationDialog, FormDialog } from '../src/components/common'
const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  medication: vi.fn(),
  reload: vi.fn(async () => {}),
}))
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})
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
  useVault: () => ({ now: new Date(), records: [], reload: mocks.reload }),
}))
vi.mock('../src/lib/api', () => ({
  errorMessage: (error: Error) => error.message,
  api: {
    medications: { save: mocks.medication },
  },
}))
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  vi.unstubAllGlobals()
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
  it('requires explicit review of scanned medication details before persisting the original dosage text', async () => {
    const dosage = 'Apply a thin layer as printed on the label.'
    mocks.medication.mockResolvedValue(undefined)
    render(
      <MedicationForm
        onClose={vi.fn()}
        reviewRequired
        initialValues={{
          name: 'Fictional cream',
          dosage,
          form: 'cream',
          strength: '1%',
          prescription_text: `Cream Fictional 1%\n${dosage}`,
        }}
      />,
    )
    fill('Dose times *', '20:00')
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and add medication' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Compare the details with the original prescription',
    )
    expect(mocks.medication).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I checked these details against the original prescription.',
      }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and add medication' }),
    )
    await waitFor(() => expect(mocks.medication).toHaveBeenCalledOnce())
    expect(mocks.medication).toHaveBeenCalledWith(
      expect.objectContaining({
        dosage,
        form: 'cream',
        strength: '1%',
        prescription_text: `Cream Fictional 1%\n${dosage}`,
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
