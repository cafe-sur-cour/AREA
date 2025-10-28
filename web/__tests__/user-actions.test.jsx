import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserActions } from '../components/UserActions';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('UserActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const pushMock = jest.fn();
  const logoutMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: pushMock });
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: logoutMock,
    });
  });

  it('renders loading state when isLoading is true', () => {
    useAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
    });

    const { container } = render(<UserActions />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders login link when user is not authenticated', () => {
    render(<UserActions />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders authenticated actions when user is authenticated (non-admin)', () => {
    useAuth.mockReturnValue({
      user: { id: 1, is_admin: false },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    render(<UserActions />);
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Logout')).toBeInTheDocument();
    expect(screen.queryByLabelText('Admin Area button')).not.toBeInTheDocument();
  });

  it('renders admin button when user is admin', () => {
    useAuth.mockReturnValue({
      user: { id: 1, is_admin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    render(<UserActions />);
    expect(screen.getByLabelText('Admin Area button')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    useAuth.mockReturnValue({
      user: { id: 1 },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    render(<UserActions />);
    const logoutBtn = screen.getByLabelText('Logout');
    fireEvent.click(logoutBtn);
    expect(logoutMock).toHaveBeenCalled();
  });

  it('navigates to /profile when profile button is clicked', () => {
    useAuth.mockReturnValue({
      user: { id: 1 },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    render(<UserActions />);
    const profileBtn = screen.getByLabelText('Profile');
    fireEvent.click(profileBtn);
    expect(pushMock).toHaveBeenCalledWith('/profile');
  });

  it('navigates to /admin when admin button is clicked', () => {
    useAuth.mockReturnValue({
      user: { id: 1, is_admin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    render(<UserActions />);
    const adminBtn = screen.getByLabelText('Admin Area button');
    fireEvent.click(adminBtn);
    expect(pushMock).toHaveBeenCalledWith('/admin');
  });

  it('renders correctly with custom className', () => {
    const { container } = render(<UserActions className="extra-class" />);
    expect(container.querySelector('.extra-class')).toBeInTheDocument();
  });

  it('renders with isMobile = true and authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: 1, is_admin: false },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    const { container } = render(<UserActions isMobile />);

    const div = container.querySelector('div');
    expect(div?.className).toContain('flex-col');

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('renders admin button on mobile too', () => {
    useAuth.mockReturnValue({
      user: { id: 1, is_admin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    render(<UserActions isMobile />);
    expect(screen.getByLabelText('Admin Area button')).toBeInTheDocument();
  });

  it('renders different nav styles based on pathname', () => {
    const mockPathname = '/dashboard';
    require('next/navigation').usePathname.mockReturnValue(mockPathname);

    useAuth.mockReturnValue({
      user: { id: 1, is_admin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: logoutMock,
    });

    const { container } = render(<UserActions />);

    const activeLink = screen.getByText('My Dashboard');
    expect(activeLink.className).toMatch(/font-semibold/);

    const otherLink = screen.getByText('My Services');
    expect(otherLink.className).not.toMatch(/font-semibold/);

    const span = container.querySelector('span.bg-gradient-to-r');
    expect(span).toBeInTheDocument();
  });

  it('renders login link in mobile mode (non-authenticated)', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: jest.fn(),
    });

    const { container } = render(<UserActions isMobile />);
    const link = screen.getByText('Login');
    expect(link).toBeInTheDocument();
    expect(container.querySelector('span.bg-gradient-to-r')).toBeInTheDocument();
  });
});
