import { render, screen, fireEvent, waitFor } from '../jest.setup';
import RegisterForm from '@/components/register-form';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  post: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({
    t: {
      auth: {
        register: {
          passwordsDoNotMatch: 'Passwords do not match',
          registrationSuccess:
            'Registration successful! Please check your email to verify your account.',
          registrationFailed: 'Registration failed: ',
          username: 'Username',
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm password',
          registerButton: 'Register',
          title: 'Welcome',
          subtitle: 'Register an Area account',
          usernamePlaceholder: 'Your username',
          emailPlaceholder: 'm@example.com',
          confirmPasswordPlaceholder: 'Confirm password',
          orContinueWith: 'Or continue with',
          loginWithGithub: 'Login with Github',
          loginWithGoogle: 'Login with Google',
          loginWithMicrosoft: 'Login with Microsoft 365',
          termsPrefix: 'By clicking continue, you agree to our',
          terms: 'Terms of Service',
          and: 'and',
          privacy: 'Privacy Policy',
        },
      },
    },
  }),
}));

describe('RegisterForm', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      push,
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders form inputs', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error if passwords do not match', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '654321' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });
  });

  it('calls API and redirects on successful registration', async () => {
    api.post.mockResolvedValue({ message: 'success' });

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '123456' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        name: 'testuser',
        password: '123456',
      });
      expect(toast.success).toHaveBeenCalledWith(
        'Registration successful! Please check your email to verify your account.'
      );
    });
  });

  it('shows error on API failure', async () => {
    api.post.mockRejectedValue(new Error('API error'));

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '123456' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Registration failed')
      );
    });
  });
});
