import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { NavLinks } from '../components/NavLinks';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('NavLinks', () => {
  test('should render all navigation links', () => {
    const { getByText } = render(<NavLinks />);

    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('Catalogue')).toBeInTheDocument();
    expect(getByText('About')).toBeInTheDocument();
  });

  test('should handle mobile mode correctly', () => {
    const { container } = render(<NavLinks isMobile />);
    expect(container.firstChild).toHaveClass('flex flex-col space-y-3');
  });

  test('should highlight active link', () => {
    const { getByText } = render(<NavLinks />);
    const activeLink = getByText('Home').closest('a');
    expect(activeLink).toHaveClass('text-area-primary');
  });

  test('should render links with correct href attributes', () => {
    const { getByText } = render(<NavLinks />);

    const homeLink = getByText('Home').closest('a');
    const catalogueLink = getByText('Catalogue').closest('a');
    const aboutLink = getByText('About').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(catalogueLink).toHaveAttribute('href', '/catalogue');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  test('should apply correct styles based on current path', () => {
    const { getByText } = render(<NavLinks />);
    const homeLink = getByText('Home').closest('a');

    // Active link (/) should have semibold font and primary color
    expect(homeLink).toHaveClass('font-semibold');
    expect(homeLink).toHaveClass('text-area-primary');

    // Other links should have medium font and secondary color
    const catalogueLink = getByText('Catalogue').closest('a');
    expect(catalogueLink).toHaveClass('font-medium');
    expect(catalogueLink).toHaveClass('text-app-text-secondary');
  });

  test('should handle click events', () => {
    const { getByText } = render(<NavLinks />);
    const link = getByText('Home');

    fireEvent.click(link);
    expect(link).toBeInTheDocument();
  });

  test('should handle keyboard navigation', () => {
    const { getByText } = render(<NavLinks />);
    const link = getByText('Home');

    fireEvent.keyPress(link, { key: 'Enter', code: 'Enter' });
    expect(link).toBeInTheDocument();
  });

  test('should render mobile specific styles', () => {
    const { getByText } = render(<NavLinks isMobile />);
    const link = getByText('Home').closest('a');
    expect(link).toHaveClass('text-center py-2 text-lg');
  });

  test('should render underline elements for each link', () => {
    const { container } = render(<NavLinks />);
    const underlines = container.getElementsByClassName('absolute');
    expect(underlines.length).toBe(3); // One for each nav item
  });
});
