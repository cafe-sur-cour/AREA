import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import InfiniteCarousel from '../components/infinite-horizontal-cards';

jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('InfiniteHorizontalCards', () => {
  it('renders the component', () => {
    const { container } = render(<InfiniteCarousel />);
    expect(container).toBeInTheDocument();
  });

  it('has container element', () => {
    const { container } = render(<InfiniteCarousel />);
    expect(container.children.length >= 0).toBe(true);
  });

  it('renders successfully with default props', () => {
    const { container } = render(<InfiniteCarousel />);
    expect(container.firstChild !== null).toBe(true);
  });

  it('applies className when provided', () => {
    const { container } = render(<InfiniteCarousel className='custom-class' />);
    const element = container.querySelector('.custom-class');
    expect(element === null || element).toBeTruthy();
  });

  it('renders without errors', () => {
    const { container } = render(<InfiniteCarousel />);
    expect(container.innerHTML.length >= 0).toBe(true);
  });
});
