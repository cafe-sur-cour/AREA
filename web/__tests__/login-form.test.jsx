import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../components/login-form';
import api from '@/lib/api';
import { toast } from 'sonner';

jest.mock('@/lib/api');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

const mockApi = api;

describe('LoginForm', () => {
  let originalLocation;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    originalLocation = window.location;

    delete window.location;
    window.location = { 
      href: 'http://localhost/',
      assign: jest.fn(),
      replace: jest.fn(),
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  test('shows error on login failure', async () => {
    mockApi.post.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' }
      }
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrongpass');

    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  test('shows error when API response is null', async () => {
    mockApi.post.mockResolvedValue({ data: null });

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), '123456');

    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No response from server');
    });
  });

  test('shows error when server does not respond', async () => {
    mockApi.post.mockRejectedValue({ response: null });

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), '123456');

    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No response from server');
    });
  });

  test('successful login redirects user', async () => {
    mockApi.post.mockResolvedValue({
      data: { token: 'fake-jwt-token' }
    });

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'correctpassword');
    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));

    await waitFor(() => {
      expect(window.location.href.endsWith('/')).toBe(true);
    });
  });

  test('shows loading state during form submission', async () => {
    mockApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));
    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeInTheDocument();
  });
});