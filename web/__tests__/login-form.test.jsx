import { render, screen, waitFor } from '../jest.setup';
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

jest.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({
    t: {
      auth: {
        login: {
          invalidCredentials: 'Invalid credentials',
          noResponseFromServer: 'No response from server',
          serverError: 'Server error',
          loginFailed: 'Login failed',
          loggingIn: 'Logging in...',
          loginButton: 'Login',
          email: 'Email',
          password: 'Password',
          forgotPassword: 'Forgot your password?',
          title: 'Welcome back',
          subtitle: 'Login to your Area account',
          emailPlaceholder: 'm@example.com',
          orContinueWith: 'Or continue with',
          loginWithGithub: 'Login with Github',
          loginWithGoogle: 'Login with Google',
          loginWithMicrosoft: 'Login with Microsoft 365',
          loginWithMeta: 'Login with Meta',
          noAccount: "Don't have an account?",
          signUp: 'Sign up',
          termsPrefix: 'By clicking continue, you agree to our',
          terms: 'Terms of Service',
          and: 'and',
          privacy: 'Privacy Policy',
        },
      },
    },
  }),
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
        data: { message: 'Invalid credentials' },
      },
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrongpass');

    await userEvent.click(
      screen.getByRole('button', { name: 'Login', exact: true })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  test('shows error when API response is null', async () => {
    mockApi.post.mockResolvedValue({ data: null });

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), '123456');

    await userEvent.click(
      screen.getByRole('button', { name: 'Login', exact: true })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No response from server');
    });
  });

  test('shows error when server does not respond', async () => {
    mockApi.post.mockRejectedValue({ response: null });

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), '123456');

    await userEvent.click(
      screen.getByRole('button', { name: 'Login', exact: true })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No response from server');
    });
  });

  test('successful login redirects user', async () => {
    mockApi.post.mockResolvedValue({
      data: { token: 'fake-jwt-token' },
    });

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(
      screen.getByPlaceholderText(/password/i),
      'correctpassword'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Login', exact: true })
    );

    await waitFor(() => {
      expect(window.location.href.endsWith('/')).toBe(true);
    });
  });

  test('shows loading state during form submission', async () => {
    mockApi.post.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password');
    await userEvent.click(
      screen.getByRole('button', { name: 'Login', exact: true })
    );
    expect(
      screen.getByRole('button', { name: 'Logging in...' })
    ).toBeInTheDocument();
  });
});
