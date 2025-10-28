/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act, waitFor, fireEvent } from './test-utils';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { api } from '@/lib/api';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Mock Lucide-React languages icon with class name support
jest.mock('lucide-react', () => ({
  Languages: ({ className }: { className?: string }) => (
    <div data-testid='languages-icon' className={className} />
  ),
}));

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock console.warn and console.error to reduce noise in tests
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

describe('LanguageSwitcher', () => {
  beforeAll(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    console.warn = originalWarn;
    console.error = originalError;
    console.log = originalLog;
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should fetch and display current language from API', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'fr' },
    });

    const { getByRole, findByText } = render(<LanguageSwitcher />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith({ endpoint: '/language' });
    });

    const button = getByRole('button');
    expect(button).toBeInTheDocument();

    const langText = await findByText('FR');
    expect(langText).toBeInTheDocument();
  });

  test('should use localStorage when API fails', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    localStorage.setItem('area-language', 'en');

    const { getByRole, getByText } = render(<LanguageSwitcher />);

    await waitFor(() => {
      const button = getByRole('button');
      expect(button).toBeInTheDocument();
      expect(getByText('EN')).toBeInTheDocument();
    });
  });

  test('should handle language switch', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'en' },
    });

    (api.post as jest.Mock).mockResolvedValueOnce({});

    const { getByRole } = render(<LanguageSwitcher />);

    const button = await waitFor(() => getByRole('button'));

    await act(async () => {
      fireEvent.click(button);
    });

    expect(api.post).toHaveBeenCalledWith('/language', { language: 'fr' });
    expect(localStorage.getItem('area-language')).toBe('fr');
  });

  test('should render mobile version correctly', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'en' },
    });

    const { container, getByText } = render(
      <LanguageSwitcher isMobile={true} />
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('w-full');
      expect(getByText('EN')).toHaveClass('text-app-text-secondary');
      expect(getByText('EN')).toHaveClass('uppercase');
      expect(getByText('EN')).toHaveClass('text-sm');
    });
  });

  test('should handle invalid language from API', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'invalid' },
    });

    const { getByRole } = render(<LanguageSwitcher />);

    // In this case, it should keep using the default 'en' value from useState
    // and not update localStorage since the API response was invalid
    await waitFor(() => {
      // The button should exist
      const button = getByRole('button');
      expect(button).toBeInTheDocument();
      // No localStorage update should happen since the API value was invalid
      expect(localStorage.getItem('area-language')).toBeNull();
    });
  });

  test('should handle API error during language switch', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'en' },
    });

    (api.post as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    const { getByRole } = render(<LanguageSwitcher />);
    const button = await waitFor(() => getByRole('button'));

    await act(async () => {
      fireEvent.click(button);
    });

    expect(localStorage.getItem('area-language')).toBe('fr');
  });

  test('should handle loading state', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'en' },
    });

    // Create a promise we can manually resolve later
    let resolvePost: (value: unknown) => void;
    const postPromise = new Promise(resolve => {
      resolvePost = resolve;
    });
    (api.post as jest.Mock).mockImplementationOnce(() => postPromise);

    const { getByRole, getByTestId } = render(<LanguageSwitcher />);

    // Wait for initial render with English
    const button = await waitFor(() => getByRole('button'));

    // Click to start loading state
    fireEvent.click(button);

    // Now we should see the loading state
    await waitFor(() => {
      expect(button).toHaveAttribute('disabled');
      const languagesIcon = getByTestId('languages-icon');
      expect(languagesIcon).toBeInTheDocument();
      // The animation class should be on the Languages icon itself
      expect(languagesIcon.className).toContain('h-5');
      expect(languagesIcon.className).toContain('w-5');
      expect(languagesIcon.className).toContain('animate-spin');
    });

    // Resolve the post request to clean up
    resolvePost({});
  });

  test('should show correct aria-label and title', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { language: 'en' },
    });

    const { getByRole } = render(<LanguageSwitcher />);

    const button = await waitFor(() => getByRole('button'));

    expect(button).toHaveAttribute('aria-label', 'Switch to French');
    expect(button).toHaveAttribute('title', 'Switch to French');
  });
});
