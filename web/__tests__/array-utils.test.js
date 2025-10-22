import '@testing-library/jest-dom';

describe('Array Utilities', () => {
  it('filters array', () => {
    const numbers = [1, 2, 3, 4, 5];
    const evens = numbers.filter(n => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  it('maps array values', () => {
    const numbers = [1, 2, 3];
    const doubled = numbers.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  it('finds element in array', () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const user = users.find(u => u.id === 1);
    expect(user.name).toBe('Alice');
  });

  it('checks if array includes value', () => {
    const colors = ['red', 'green', 'blue'];
    expect(colors.includes('red')).toBe(true);
    expect(colors.includes('yellow')).toBe(false);
  });

  it('reduces array to single value', () => {
    const numbers = [1, 2, 3, 4];
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(10);
  });

  it('sorts array', () => {
    const numbers = [3, 1, 4, 1, 5];
    const sorted = [...numbers].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 1, 3, 4, 5]);
  });

  it('removes duplicates', () => {
    const numbers = [1, 2, 2, 3, 3, 3];
    const unique = [...new Set(numbers)];
    expect(unique).toEqual([1, 2, 3]);
  });

  it('flattens nested array', () => {
    const nested = [1, [2, 3], [4, [5]]];
    const flat = nested.flat(2);
    expect(flat).toContain(1);
    expect(flat).toContain(5);
  });
});
