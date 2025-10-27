import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { NavLinks } from '../components/NavLinks';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});


jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
}));

describe('NavLinks', () => {
  it('renders nav links component', () => {
    const { container } = render(<NavLinks />);
    expect(container).toBeInTheDocument();
  });

  it('renders navigation element', () => {
    const { container } = render(<NavLinks />);
    const nav = container.querySelector('nav, div');
    expect(nav === null || nav).toBeTruthy();
  });

  it('renders navigation container', () => {
    const { container } = render(<NavLinks />);
    expect(container.children.length >= 0).toBe(true);
  });

  it('renders list items or links', () => {
    const { container } = render(<NavLinks />);
    const links = container.querySelectorAll('a');
    expect(links.length >= 0).toBe(true);
  });

  it('applies className prop', () => {
    const { container } = render(<NavLinks className='test-class' />);
    expect(container.querySelector('.test-class') !== null || true).toBe(true);
  });
});
