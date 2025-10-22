import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Navigation from '../components/header'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}))

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: jest.fn(),
    refreshUserInfo: jest.fn(),
  })),
  AuthProvider: ({ children }) => children,
}))

describe('Navigation Header', () => {
  it('renders the navigation component', () => {
    render(<Navigation />)
    expect(document.querySelector('nav')).toBeInTheDocument()
  })

  it('displays logo/title', () => {
    render(<Navigation />)
    const heading = screen.getByText('Area')
    expect(heading).toBeInTheDocument()
  })

  it('has navigation element', () => {
    render(<Navigation />)
    expect(document.querySelector('nav')).toBeInTheDocument()
  })
})