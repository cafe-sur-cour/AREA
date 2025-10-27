import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import InputPassword from '../components/ui/input-password';

jest.mock('react-icons/lu', () => ({
  LuEye: () => <svg data-testid="eye-open" />,
  LuEyeClosed: () => <svg data-testid="eye-closed" />,
}));

describe('InputPassword', () => {
  it('renders input of type password by default', () => {
    render(<InputPassword />);
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders toggle icon (eye)', () => {
    render(<InputPassword />);
    expect(screen.getByTestId('eye-open')).toBeInTheDocument();
  });

  it('toggles password visibility on click', () => {
    render(<InputPassword />);
    const toggle = screen.getByRole('button', { name: /toggle password visibility/i });
    const input = screen.getByPlaceholderText('Password');

    // Initial state
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('eye-open')).toBeInTheDocument();

    // Click 1
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('eye-closed')).toBeInTheDocument();

    // Click 2
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('eye-open')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<InputPassword className="extra-class" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('extra-class');
  });

  it('spreads additional props to input element', () => {
    render(<InputPassword data-testid="pwd-input" aria-label="mypassword" />);
    const input = screen.getByTestId('pwd-input');
    expect(input).toHaveAttribute('aria-label', 'mypassword');
  });
});