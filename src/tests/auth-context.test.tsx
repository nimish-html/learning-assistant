/**
 * Authentication Context Provider Tests
 * 
 * Tests for the AuthProvider component and useAuth hook,
 * including session persistence, state management, and error handling.
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import type { User } from '../lib/auth.types'

// Mock the Supabase client to avoid ES module issues
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    }
  }
}))

// Mock the AuthService
jest.mock('../lib/auth-service')

// Import after mocking
const { AuthProvider, useAuth } = require('../lib/auth-context')
const { AuthService } = require('../lib/auth-service')
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signUp, signIn, signOut, resetPassword } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => signUp('test@example.com', 'password123')}>
        Sign Up
      </button>
      <button onClick={() => signIn('test@example.com', 'password123')}>
        Sign In
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
      <button onClick={() => resetPassword('test@example.com')}>
        Reset Password
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  let mockUnsubscribe: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnsubscribe = jest.fn()
    
    // Default mock implementations
    mockAuthService.getCurrentUser.mockResolvedValue(null)
    mockAuthService.onAuthStateChange.mockReturnValue(mockUnsubscribe)
    mockAuthService.signUp.mockResolvedValue(mockUser)
    mockAuthService.signIn.mockResolvedValue(mockUser)
    mockAuthService.signOut.mockResolvedValue(undefined)
    mockAuthService.resetPassword.mockResolvedValue(undefined)
  })

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })

    it('should get current user on mount', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should handle initialization error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Network error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(consoleError).toHaveBeenCalledWith('Error initializing auth:', expect.any(Error))
      consoleError.mockRestore()
    })

    it('should set up auth state change listener', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(mockAuthService.onAuthStateChange).toHaveBeenCalledTimes(1)
      expect(mockAuthService.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should clean up auth state change listener on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('Auth State Changes', () => {
    it('should update user state when auth state changes', async () => {
      let authStateCallback: (user: User | null) => void = () => {}
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return mockUnsubscribe
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate auth state change
      act(() => {
        authStateCallback(mockUser)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should handle user sign out via auth state change', async () => {
      let authStateCallback: (user: User | null) => void = () => {}
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return mockUnsubscribe
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // First sign in
      act(() => {
        authStateCallback(mockUser)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Then sign out
      act(() => {
        authStateCallback(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })
  })

  describe('Authentication Methods', () => {
    it('should handle sign up successfully', async () => {
      let authStateCallback: (user: User | null) => void = () => {}
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return mockUnsubscribe
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const signUpButton = screen.getByText('Sign Up')
      
      await act(async () => {
        signUpButton.click()
      })

      expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should handle sign up error', async () => {
      const error = new Error('Sign up failed')
      mockAuthService.signUp.mockRejectedValue(error)

      // Create a test component that handles the error
      function TestComponentWithErrorHandling() {
        const { signUp, loading } = useAuth()
        const [errorMessage, setErrorMessage] = React.useState('')
        
        const handleSignUp = async () => {
          try {
            await signUp('test@example.com', 'password123')
          } catch (e) {
            setErrorMessage((e as Error).message)
          }
        }
        
        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <div data-testid="error">{errorMessage}</div>
            <button onClick={handleSignUp}>Sign Up</button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponentWithErrorHandling />
        </AuthProvider>
      )

      const signUpButton = screen.getByText('Sign Up')
      
      await act(async () => {
        signUpButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign up failed')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should handle sign in successfully', async () => {
      let authStateCallback: (user: User | null) => void = () => {}
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return mockUnsubscribe
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const signInButton = screen.getByText('Sign In')
      
      await act(async () => {
        signInButton.click()
      })

      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should handle sign in error', async () => {
      const error = new Error('Sign in failed')
      mockAuthService.signIn.mockRejectedValue(error)

      // Create a test component that handles the error
      function TestComponentWithErrorHandling() {
        const { signIn, loading } = useAuth()
        const [errorMessage, setErrorMessage] = React.useState('')
        
        const handleSignIn = async () => {
          try {
            await signIn('test@example.com', 'password123')
          } catch (e) {
            setErrorMessage((e as Error).message)
          }
        }
        
        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <div data-testid="error">{errorMessage}</div>
            <button onClick={handleSignIn}>Sign In</button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponentWithErrorHandling />
        </AuthProvider>
      )

      const signInButton = screen.getByText('Sign In')
      
      await act(async () => {
        signInButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign in failed')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should handle sign out successfully', async () => {
      let authStateCallback: (user: User | null) => void = () => {}
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return mockUnsubscribe
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const signOutButton = screen.getByText('Sign Out')
      
      await act(async () => {
        signOutButton.click()
      })

      expect(mockAuthService.signOut).toHaveBeenCalledTimes(1)
    })

    it('should handle sign out error', async () => {
      const error = new Error('Sign out failed')
      mockAuthService.signOut.mockRejectedValue(error)

      // Create a test component that handles the error
      function TestComponentWithErrorHandling() {
        const { signOut, loading } = useAuth()
        const [errorMessage, setErrorMessage] = React.useState('')
        
        const handleSignOut = async () => {
          try {
            await signOut()
          } catch (e) {
            setErrorMessage((e as Error).message)
          }
        }
        
        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <div data-testid="error">{errorMessage}</div>
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponentWithErrorHandling />
        </AuthProvider>
      )

      const signOutButton = screen.getByText('Sign Out')
      
      await act(async () => {
        signOutButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign out failed')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should handle password reset successfully', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password')
      
      await act(async () => {
        resetButton.click()
      })

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com')
    })

    it('should handle password reset error', async () => {
      const error = new Error('Reset failed')
      mockAuthService.resetPassword.mockRejectedValue(error)

      // Create a test component that handles the error
      function TestComponentWithErrorHandling() {
        const { resetPassword } = useAuth()
        const [errorMessage, setErrorMessage] = React.useState('')
        
        const handleResetPassword = async () => {
          try {
            await resetPassword('test@example.com')
          } catch (e) {
            setErrorMessage((e as Error).message)
          }
        }
        
        return (
          <div>
            <div data-testid="error">{errorMessage}</div>
            <button onClick={handleResetPassword}>Reset Password</button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponentWithErrorHandling />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password')
      
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Reset failed')
      })
    })
  })

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleError.mockRestore()
    })

    it('should provide auth context when used within AuthProvider', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Should render without throwing
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('user')).toBeInTheDocument()
    })
  })

  describe('Session Persistence', () => {
    it('should maintain user state across re-renders', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // User should still be present after rerender
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    it('should handle component unmount during async operations', async () => {
      let resolveGetUser: (user: User | null) => void
      const getUserPromise = new Promise<User | null>((resolve) => {
        resolveGetUser = resolve
      })
      
      mockAuthService.getCurrentUser.mockReturnValue(getUserPromise)

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Unmount before async operation completes
      unmount()

      // Resolve the promise after unmount
      act(() => {
        resolveGetUser(mockUser)
      })

      // Should not cause any errors or state updates
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })
})