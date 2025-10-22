import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegisterForm } from '../components/register-form'
import api from '../lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Mock the API
jest.mock('../lib/api', () => ({
  post: jest.fn(),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('RegisterForm', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({
      push: mockPush,
    })
  })

  it('renders the registration form', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    const passwordLabels = screen.getAllByText(/password/i)
    expect(passwordLabels.length).toBeGreaterThan(0)
  })

  it('shows social registration options', () => {
    render(<RegisterForm />)

    const allButtons = screen.getAllByRole('button')
    expect(allButtons.length).toBeGreaterThan(0)
  })

  it('shows login link', () => {
    render(<RegisterForm />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})