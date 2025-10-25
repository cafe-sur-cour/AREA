import '@testing-library/jest-dom';

describe('Object Utilities', () => {
  it('merges objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };
    const merged = { ...obj1, ...obj2 };
    expect(merged).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('gets object keys', () => {
    const obj = { name: 'John', age: 30 };
    const keys = Object.keys(obj);
    expect(keys).toEqual(['name', 'age']);
  });

  it('gets object values', () => {
    const obj = { name: 'John', age: 30 };
    const values = Object.values(obj);
    expect(values).toContain('John');
    expect(values).toContain(30);
  });

  it('gets object entries', () => {
    const obj = { a: 1, b: 2 };
    const entries = Object.entries(obj);
    expect(entries).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('clones object', () => {
    const original = { a: 1, b: { c: 2 } };
    const shallow = { ...original };
    shallow.a = 5;
    expect(original.a).toBe(1);
  });

  it('checks if property exists', () => {
    const obj = { name: 'John' };
    expect('name' in obj).toBe(true);
    expect('age' in obj).toBe(false);
  });

  it('filters object properties', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const filtered = Object.fromEntries(
      Object.entries(obj).filter(([key]) => key !== 'b')
    );
    expect(filtered).toEqual({ a: 1, c: 3 });
  });

  it('deep merges objects', () => {
    const obj1 = { a: 1, b: { x: 10 } };
    const obj2 = { b: { y: 20 }, c: 3 };
    const merged = {
      ...obj1,
      b: { ...obj1.b, ...obj2.b },
    };
    expect(merged.b).toHaveProperty('x');
    expect(merged.b).toHaveProperty('y');
  });
});
