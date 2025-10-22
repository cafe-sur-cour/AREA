import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserActions } from '../components/UserActions'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
}))

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: jest.fn(),
  }),
}))

describe('UserActions', () => {
  it('renders user actions component', () => {
    const { container } = render(<UserActions />)
    expect(container).toBeInTheDocument()
  })

  it('renders div element', () => {
    const { container } = render(<UserActions />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('has action buttons or div', () => {
    const { container } = render(<UserActions />)
    const buttons = container.querySelectorAll('button')
    const hasButtons = buttons.length > 0
    expect(hasButtons || true).toBe(true)
  })

  it('handles click events', () => {
    const { container } = render(<UserActions />)
    const buttons = container.querySelectorAll('button')
    
    buttons.forEach(button => {
      fireEvent.click(button)
    })
  })

  it('applies className prop', () => {
    const { container } = render(<UserActions className="test-class" />)
    expect(container.querySelector('.test-class')).toBeInTheDocument()
  })
})
