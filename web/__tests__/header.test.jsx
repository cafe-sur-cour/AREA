import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Navigation from '../components/header';

// Mock Next.js router

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

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
}));

describe('Navigation Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders the navigation component', () => {
    render(<Navigation />);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  it('displays logo/title', () => {
    render(<Navigation />);
    const heading = screen.getByText('Area');
    expect(heading).toBeInTheDocument();
  });

  it('has navigation element', () => {
    render(<Navigation />);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });
});
