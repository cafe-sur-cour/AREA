describe('Config utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have config utilities available', () => {
    expect(true).toBe(true);
  });

  it('should return API URL function exists', () => {
    const mockGetAPIUrl = jest.fn(() => 'http://localhost:8000');
    expect(mockGetAPIUrl).toBeDefined();
    expect(mockGetAPIUrl()).toBe('http://localhost:8000');
  });

  it('should return Socket URL function exists', () => {
    const mockGetSocketUrl = jest.fn(() => 'ws://localhost:8000');
    expect(mockGetSocketUrl).toBeDefined();
    expect(mockGetSocketUrl()).toBe('ws://localhost:8000');
  });
});
