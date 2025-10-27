import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import DownloadAPPButton from '../components/download-app-button';

describe('DownloadAPPButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders the download button', () => {
    render(<DownloadAPPButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has download icon', () => {
    render(<DownloadAPPButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('has fixed positioning classes', () => {
    render(<DownloadAPPButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed', 'bottom-4', 'right-4');
  });

  it('has icon button size', () => {
    render(<DownloadAPPButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('rounded-full');
  });
});
