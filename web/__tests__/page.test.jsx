import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../app/page';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

describe('Home', () => {
  it('renders the main heading', async () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    await waitFor(() => {
      const heading = screen.getByText(
        'Automate your life with powerful connections'
      );
      expect(heading).toBeInTheDocument();
    });
  });
});
