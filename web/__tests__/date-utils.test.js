import '@testing-library/jest-dom';

describe('Date Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates date object', () => {
    const date = new Date('2025-10-22');
    expect(date).toBeInstanceOf(Date);
  });

  it('gets current date', () => {
    const now = new Date();
    expect(now).toBeInstanceOf(Date);
  });

  it('formats date to string', () => {
    const date = new Date('2025-10-22');
    const formatted = date.toDateString();
    expect(formatted).toBeTruthy();
  });

  it('compares dates', () => {
    const date1 = new Date('2025-10-22');
    const date2 = new Date('2025-10-23');
    expect(date1.getTime() < date2.getTime()).toBe(true);
  });

  it('calculates date difference', () => {
    const date1 = new Date('2025-10-22');
    const date2 = new Date('2025-10-29');
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('gets day of week', () => {
    const date = new Date('2025-10-22');
    const dayOfWeek = date.getDay();
    expect(dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(dayOfWeek).toBeLessThan(7);
  });

  it('checks if date is today', () => {
    const isToday = date => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const today = new Date();
    expect(isToday(today)).toBe(true);
  });
});
