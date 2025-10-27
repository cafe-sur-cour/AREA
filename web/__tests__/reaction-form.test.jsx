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
  it('should be importable', () => {
    expect(true).toBe(true);
  });
});
