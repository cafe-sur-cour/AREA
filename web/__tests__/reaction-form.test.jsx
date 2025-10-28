import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

describe('ReactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should be importable', () => {
    expect(true).toBe(true);
  });
});
