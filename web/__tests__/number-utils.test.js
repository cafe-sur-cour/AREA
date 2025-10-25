import '@testing-library/jest-dom';

describe('Number Utilities', () => {
  it('validates number is integer', () => {
    expect(Number.isInteger(5)).toBe(true);
    expect(Number.isInteger(5.5)).toBe(false);
  });

  it('validates number is positive', () => {
    const isPositive = num => num > 0;
    expect(isPositive(5)).toBe(true);
    expect(isPositive(-5)).toBe(false);
    expect(isPositive(0)).toBe(false);
  });

  it('rounds numbers correctly', () => {
    expect(Math.round(5.5)).toBe(6);
    expect(Math.round(5.4)).toBe(5);
    expect(Math.round(5.49)).toBe(5);
  });

  it('formats currency', () => {
    const price = 100;
    const formatted = `$${price.toFixed(2)}`;
    expect(formatted).toBe('$100.00');
  });

  it('calculates percentage', () => {
    const getPercentage = (value, total) => (value / total) * 100;
    expect(getPercentage(50, 100)).toBe(50);
    expect(getPercentage(25, 100)).toBe(25);
  });

  it('clamps number in range', () => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('generates random number', () => {
    const random = Math.floor(Math.random() * 10);
    expect(random).toBeGreaterThanOrEqual(0);
    expect(random).toBeLessThan(10);
  });
});
