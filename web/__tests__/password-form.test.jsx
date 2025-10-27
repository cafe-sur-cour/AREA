import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordEmailForm, default as PasswordForm } from '../components/password-form';
import api from '../lib/api';
import { toast } from 'sonner';

// Mock des dépendances
const mockPush = jest.fn();
jest.mock('../lib/api', () => ({
  post: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation((param) => param === 'token' ? 'test-token' : null),
  }),
}));

describe('PasswordEmailForm (Forgot Password)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders password email form correctly', () => {
    render(<PasswordEmailForm />);
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByText('Request password reset')).toBeInTheDocument();
  });

  it('handles email input correctly', async () => {
    render(<PasswordEmailForm />);
    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('validates email input', async () => {
    render(<PasswordEmailForm />);
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByText('Request password reset');
    
    // Test with invalid email
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);
    expect(emailInput).toBeInvalid();

    // Test with valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid@email.com');
    expect(emailInput).toBeValid();
  });

  it('handles successful password reset request', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Reset link sent' } });
    
    render(<PasswordEmailForm />);
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByText('Request password reset');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(toast.success).toHaveBeenCalledWith('Reset link sent');
    });

    // Simuler le délai de redirection
    await new Promise(resolve => setTimeout(resolve, 4100));
    expect(mockPush).toHaveBeenCalledWith('/login');
  }, 10000);

  it('shows loading state during submission', async () => {
    api.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<PasswordEmailForm />);
    const submitButton = screen.getByText('Request password reset');
    
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Requesting password reset link...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  }, 10000);
});

describe('PasswordForm (Reset Password)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders reset password form correctly', () => {
    render(<PasswordForm />);
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByText('Reset password')).toBeInTheDocument();
  });

  it('validates password matching', async () => {
    render(<PasswordForm />);
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByText('Reset password');

    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmInput, 'password124');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });
  }, 10000);

  it('handles successful password reset', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Password reset successful' } });
    
    render(<PasswordForm />);
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByText('Reset password');

    await userEvent.type(passwordInput, 'newpassword123');
    await userEvent.type(confirmInput, 'newpassword123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        { newPassword: 'newpassword123' },
        'test-token'
      );
      expect(toast.success).toHaveBeenCalledWith('Password reset successful');
    });

    // Simuler le délai de redirection
    await new Promise(resolve => setTimeout(resolve, 4100));
    expect(mockPush).toHaveBeenCalledWith('/login');
  }, 10000);

  it('handles missing token error', async () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue(null)
    };

    jest.spyOn(require('next/navigation'), 'useSearchParams').mockImplementation(() => mockSearchParams);
    
    render(<PasswordForm />);
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByText('Reset password');

    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid or expired token');
    });
  }, 10000);

});
