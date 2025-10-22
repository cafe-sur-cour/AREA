import '@testing-library/jest-dom'

describe('Token Management', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('localStorage is available', () => {
    expect(localStorage).toBeDefined()
  })

  it('can set and get from localStorage', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
  })

  it('can clear localStorage', () => {
    localStorage.setItem('test', 'value')
    localStorage.clear()
    expect(localStorage.getItem('test')).toBeNull()
  })

  it('handles multiple items', () => {
    localStorage.setItem('item1', 'value1')
    localStorage.setItem('item2', 'value2')
    
    expect(localStorage.getItem('item1')).toBe('value1')
    expect(localStorage.getItem('item2')).toBe('value2')
  })

  it('can remove specific items', () => {
    localStorage.setItem('test', 'value')
    localStorage.removeItem('test')
    expect(localStorage.getItem('test')).toBeNull()
  })

  it('handles token storage', () => {
    const token = 'test-auth-token-12345'
    localStorage.setItem('authToken', token)
    expect(localStorage.getItem('authToken')).toBe(token)
  })
})
