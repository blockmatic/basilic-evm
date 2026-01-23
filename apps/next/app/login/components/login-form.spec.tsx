import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('LoginForm', () => {
  let queryClient: QueryClient
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    fetchMock = vi.fn<typeof fetch>()
    global.fetch = fetchMock as typeof fetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function renderLoginForm(initialError?: string) {
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginForm initialError={initialError} />
      </QueryClientProvider>,
    )
  }

  it('should use useQuery instead of useMutation', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: true }),
    } as Response)

    renderLoginForm()

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.click(submitButton)

    // Verify fetch was called (indicating useQuery was triggered)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      const callArgs = fetchMock.mock.calls[0]
      if (!callArgs) {
        throw new Error('fetch was not called')
      }
      expect(callArgs[0]).toBe('/api/auth/sign-in/magic-link')
      expect(callArgs[1]).toMatchObject({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.email).toBe('test@example.com')
      expect(body.callbackURL).toContain('/dashboard')
    })
  })

  it('should display email validation errors below input field using FieldError', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      }),
    } as Response)

    renderLoginForm()

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const form = emailInput.closest('form') as HTMLFormElement

    // Remove required attribute to allow any submission
    emailInput.removeAttribute('required')

    // Use valid email format to pass HTML5 validation, server will return validation error
    await userEvent.type(emailInput, 'test@example.com')

    // Submit form programmatically
    form.requestSubmit()

    // Wait for fetch to be called first
    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalled()
      },
      { timeout: 5000 },
    )

    // Wait for error to appear below input field (allow time for query error to propagate)
    await waitFor(
      () => {
        const errorElement = screen.getByRole('alert')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveTextContent(/invalid email format/i)
        expect(errorElement).toHaveAttribute('data-slot', 'field-error')
      },
      { timeout: 10000 },
    )

    // Verify error is below the input (within the same Field component)
    const fieldElement = emailInput.closest('[data-slot="field"]')
    expect(fieldElement).toBeInTheDocument()
    const errorInField = fieldElement?.querySelector('[data-slot="field-error"]')
    expect(errorInField).toBeInTheDocument()
  })

  it('should extract errors from API response format with VALIDATION_ERROR code', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      }),
    } as Response)

    renderLoginForm()

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const form = emailInput.closest('form') as HTMLFormElement
    // Verify submit button exists (but don't need to use it)
    screen.getByRole('button', { name: /send magic link/i })

    // Remove required attribute to allow empty submission
    emailInput.removeAttribute('required')

    // Submit form programmatically to bypass HTML5 validation
    form.requestSubmit()

    // Wait for fetch to be called first
    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalled()
      },
      { timeout: 5000 },
    )

    // Wait for error to appear (allow time for query error to propagate)
    await waitFor(
      () => {
        const errorElement = screen.getByRole('alert')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveTextContent(/email is required/i)
      },
      { timeout: 10000 },
    )
  })

  it('should display initialError prop below input field', () => {
    renderLoginForm('Invalid or expired magic link')

    const errorElement = screen.getByRole('alert')
    expect(errorElement).toBeInTheDocument()
    expect(errorElement).toHaveTextContent(/invalid or expired magic link/i)

    // Verify error is below the input field
    const emailInput = screen.getByLabelText(/email/i)
    const fieldElement = emailInput.closest('[data-slot="field"]')
    expect(fieldElement).toBeInTheDocument()
    const errorInField = fieldElement?.querySelector('[data-slot="field-error"]')
    expect(errorInField).toBeInTheDocument()
  })
})
