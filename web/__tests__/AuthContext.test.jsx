import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

const mockGet = jest.fn()
const mockPost = jest.fn()
const mockGetToken = jest.fn()

jest.mock('@/lib/api', () => ({
  get: (...args) => mockGet(...args),
  post: (...args) => mockPost(...args),
}))

jest.mock('@/lib/manageToken', () => ({
  getToken: (...args) => mockGetToken(...args),
}))

beforeEach(() => {
  const store = {}
  global.localStorage = {
    getItem: key => store[key] || null,
    setItem: (key, val) => (store[key] = val),
    removeItem: key => delete store[key],
  clear: () => Object.keys(store).forEach(k => delete store[k]),
  }
  mockGet.mockReset()
  mockPost.mockReset()
  mockGetToken.mockReset()
})

function TestComponent() {
  const { user, isAuthenticated, isLoading, logout, refreshUserInfo } = useAuth()

  return (
  <div>
    <p data-testid="user">{user ? user.name : 'none'}</p>
    <p data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</p>
    <p data-testid="loading">{isLoading ? 'loading' : 'done'}</p>
    <button data-testid="logout" onClick={logout}>Logout</button>
    <button data-testid="refresh" onClick={refreshUserInfo}>Refresh</button>
  </div>
  )
}

describe('AuthProvider', () => {
  test('✅ charge l’utilisateur depuis l’API', async () => {
    mockGetToken.mockResolvedValue('token')
    mockGet.mockResolvedValueOnce({ data: { name: 'John' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('John'))
    expect(screen.getByTestId('auth')).toHaveTextContent('yes')
  })

  test('✅ utilise le cache local valide', async () => {
    const cached = {
      timestamp: Date.now(),
      user: { name: 'CachedUser' },
    }
    localStorage.setItem('userDataEnriched', JSON.stringify(cached))
    mockGetToken.mockResolvedValue('token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('CachedUser'))
  })

  test('✅ cache expiré -> recharge depuis API', async () => {
    const cached = {
      timestamp: Date.now() - 9999999,
      user: { name: 'OldUser' },
    }
    localStorage.setItem('userDataEnriched', JSON.stringify(cached))
    mockGetToken.mockResolvedValue('token')
    mockGet.mockResolvedValueOnce({ data: { name: 'FreshUser' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('FreshUser'))
  })

  test('✅ cache corrompu -> supprimé', async () => {
    localStorage.setItem('userDataEnriched', '{bad-json')
    mockGetToken.mockResolvedValue('token')
    mockGet.mockResolvedValueOnce({ data: { name: 'FixedUser' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('FixedUser'))
    expect(localStorage.getItem('userDataEnriched')).toBeNull()
  })

  test('✅ aucun token -> isAuthenticated=false', async () => {
    mockGetToken.mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('no'))
  })

  test('✅ refreshUserInfo met à jour le user', async () => {
    mockGetToken.mockResolvedValue('token')
    mockGet.mockResolvedValueOnce({ data: { name: 'Refreshed' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
  )

    const btn = screen.getByTestId('refresh')
    await act(async () => btn.click())

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Refreshed'))
  })

  test('✅ logout remet user à null', async () => {
    mockGetToken.mockResolvedValue('token')
    mockGet.mockResolvedValueOnce({ data: { name: 'UserToLogout' } })
    mockPost.mockResolvedValueOnce({})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
  )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('UserToLogout'))
    const btn = screen.getByTestId('logout')
    await act(async () => btn.click())

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(mockPost).toHaveBeenCalledWith('/auth/logout')
  })

  test('✅ refreshUserInfo échoue -> garde user null', async () => {
    mockGetToken.mockResolvedValue('token')
    mockGet.mockRejectedValueOnce(new Error('fail'))
    mockPost.mockResolvedValue({}) // ✅ ajouté

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const btn = screen.getByTestId('refresh')
    await act(async () => btn.click())

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
  })
})