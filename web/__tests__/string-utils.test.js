import '@testing-library/jest-dom';

describe('String Utilities', () => {
  it('validates email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid@email')).toBe(false);
    expect(emailRegex.test('notanemail')).toBe(false);
  });

  it('validates password strength', () => {
    const isStrongPassword = password => {
      return (
        password.length >= 8 && /[a-z]/.test(password) && /[0-9]/.test(password)
      );
    };

    expect(isStrongPassword('Pass1234')).toBe(true);
    expect(isStrongPassword('weak')).toBe(false);
    expect(isStrongPassword('12345678')).toBe(false);
  });

  it('trims whitespace', () => {
    const text = '  hello world  ';
    expect(text.trim()).toBe('hello world');
  });

  it('converts to lowercase', () => {
    expect('TEST'.toLowerCase()).toBe('test');
  });

  it('validates URL format', () => {
    const isValidUrl = url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('extracts domain from email', () => {
    const email = 'user@example.com';
    const domain = email.split('@')[1];
    expect(domain).toBe('example.com');
  });
});
