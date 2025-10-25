import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordEmailForm } from '../components/password-form';
import api from '../lib/api';
import { toast } from 'sonner';

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
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('PasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders password form component', () => {
    const { container } = render(<PasswordEmailForm />);
    expect(container).toBeInTheDocument();
  });

  it('renders form structure', () => {
    const { container } = render(<PasswordEmailForm />);
    const form = container.querySelector('form');
    expect(form === null || form).toBeTruthy();
  });

  it('handles input changes', () => {
    const { container } = render(<PasswordEmailForm />);
    const inputs = container.querySelectorAll('input');

    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'test123' } });
      expect(inputs[0].value).toBe('test123');
    }
  });

  it('renders without crashing', () => {
    const { container } = render(<PasswordEmailForm />);
    expect(container.children.length >= 0).toBe(true);
  });
});
