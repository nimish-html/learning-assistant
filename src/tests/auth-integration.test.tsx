/**
 * Authentication Integration Tests
 * 
 * Comprehensive integration tests for authentication flow including:
 * - Complete sign-up and sign-in workflows
 * - Email verification and password reset flows
 * - Session persistence across page refreshes
 * - Error handling and recovery scenarios
 */

import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../lib/auth-context'
import SignUpForm from '../components/SignUpForm'
import SignInForm from '../components/SignInForm'
import ResetPasswordForm from '../components/ResetPasswordForm'
import { AuthService } from '../lib/auth-service'
import type { User } from '../lib/auth.types'

// Mock Supabase client
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

// Mock window.location
const mockLocation = {
  origin: 'http://localhost',
  href: 'http://localhost',
  reload: jest.fn()
}

// Mock window object for tests
;(global as any).window = {
  location: mockLocation
}

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

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser
}

describe('Authentication Integration Tests', () => {
  let mockUnsubscribe: jest.Mock
  let authStateCallback: (user: User | null) => void
  let mockSupabaseAuth: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnsubscribe = jest.fn()
    
    // Get the mocked supabase auth
    mockSupabaseAuth = require('../lib/supabase').supabase.auth
    
    // Setup default auth state change mock
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    
    // Default to no user
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
  })

  describe('Complete Sign-Up Workflow', () => {
    it('should handle successful user registration flow', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      
      // Mock successful sign up
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      render(
        <AuthProvider>
          <SignUpForm onSuccess={onSuccess} />
        </AuthProvider>
      )

      // Fill out the form
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const submitButton = screen.getByTestId('signup-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      // Submit the form
      await user.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: 'http://localhost/auth/callback'
          }
        })
      })

      // Verify success state is shown
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument()
        expect(screen.getByText(/check your email to verify/i)).toBeInTheDocument()
      })

      // Verify success callback is called after delay
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should handle sign-up validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <SignUpForm />
        </AuthProvider>
      )

      const submitButton = screen.getByTestId('signup-button')

      // Submit empty form
      await user.click(submitButton)

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required')
        expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Please confirm your password')
      })

      // Verify API was not called
      expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled()
    })

    it('should handle password mismatch error', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <SignUpForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const submitButton = screen.getByTestId('signup-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'differentpassword')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Passwords do not match')
      })

      expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled()
    })

    it('should handle sign-up API errors', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 400 }
      })

      render(
        <AuthProvider>
          <SignUpForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const submitButton = screen.getByTestId('signup-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'An account with this email already exists. Please sign in instead.'
        )
      })
    })

    it('should show loading state during sign-up', async () => {
      const user = userEvent.setup()
      
      // Mock delayed response
      let resolveSignUp: (value: any) => void
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve
      })
      mockSupabaseAuth.signUp.mockReturnValue(signUpPromise)

      render(
        <AuthProvider>
          <SignUpForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const submitButton = screen.getByTestId('signup-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      await user.click(submitButton)

      // Verify loading state
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Resolve the promise
      act(() => {
        resolveSignUp({
          data: { user: mockUser, session: null },
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument()
      })
    })
  })

  describe('Complete Sign-In Workflow', () => {
    it('should handle successful user sign-in flow', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      
      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SignInForm onSuccess={onSuccess} />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('signin-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      await user.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      // Verify success state
      await waitFor(() => {
        expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
        expect(screen.getByText(/signed in successfully/i)).toBeInTheDocument()
      })

      // Verify success callback is called
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should handle sign-in validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const submitButton = screen.getByTestId('signin-button')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required')
      })

      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should handle invalid credentials error', async () => {
      const user = userEvent.setup()
      
      // Mock invalid credentials error
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 }
      })

      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('signin-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Invalid email or password. Please check your credentials and try again.'
        )
      })
    })

    it('should handle email not confirmed error', async () => {
      const user = userEvent.setup()
      
      // Mock email not confirmed error
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', status: 400 }
      })

      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('signin-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Please check your email and click the confirmation link before signing in.'
        )
      })
    })

    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const toggleButton = screen.getByTestId('toggle-password-visibility')

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password')

      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')

      // Click to hide password again
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Password Reset Workflow', () => {
    it('should handle successful password reset request', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      
      // Mock successful password reset
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        error: null
      })

      render(
        <AuthProvider>
          <ResetPasswordForm onSuccess={onSuccess} />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const submitButton = screen.getByTestId('reset-password-button')

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          {
            redirectTo: 'http://localhost/auth/reset-password'
          }
        )
      })

      // Verify success state
      await waitFor(() => {
        expect(screen.getByText('Email Sent!')).toBeInTheDocument()
        expect(screen.getByText(/reset email sent successfully/i)).toBeInTheDocument()
      })

      // Verify success callback is called
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 4000 })
    })

    it('should handle password reset validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <ResetPasswordForm />
        </AuthProvider>
      )

      const submitButton = screen.getByTestId('reset-password-button')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
      })

      expect(mockSupabaseAuth.resetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('should handle password reset API errors', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Too many requests', status: 429 }
      })

      render(
        <AuthProvider>
          <ResetPasswordForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const submitButton = screen.getByTestId('reset-password-button')

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Too many attempts. Please wait a moment before trying again.'
        )
      })
    })
  })

  describe('Session Persistence', () => {
    it('should restore user session on page refresh', async () => {
      // Mock existing session
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Component that displays current user
      function SessionTestComponent() {
        const { user, loading } = require('../lib/auth-context').useAuth()
        
        if (loading) return <div data-testid="loading">Loading...</div>
        
        return (
          <div>
            <div data-testid="user-email">{user?.email || 'No user'}</div>
            <div data-testid="user-id">{user?.id || 'No ID'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument()

      // Should restore user session
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id')
      })

      // Verify session was checked
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled()
    })

    it('should handle session restoration errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      // Mock session restoration error
      mockSupabaseAuth.getUser.mockRejectedValue(new Error('Network error'))

      function SessionTestComponent() {
        const { user, loading } = require('../lib/auth-context').useAuth()
        
        if (loading) return <div data-testid="loading">Loading...</div>
        
        return <div data-testid="user-email">{user?.email || 'No user'}</div>
      }

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      // Should eventually show no user state
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
      })

      expect(consoleError).toHaveBeenCalledWith('Error initializing auth:', expect.any(Error))
      consoleError.mockRestore()
    })

    it('should maintain session across component re-renders', async () => {
      // Mock existing session
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      function SessionTestComponent() {
        const { user, loading } = require('../lib/auth-context').useAuth()
        const [renderCount, setRenderCount] = React.useState(0)
        
        React.useEffect(() => {
          setRenderCount(prev => prev + 1)
        }, [])
        
        if (loading) return <div data-testid="loading">Loading...</div>
        
        return (
          <div>
            <div data-testid="user-email">{user?.email || 'No user'}</div>
            <div data-testid="render-count">{renderCount}</div>
            <button onClick={() => setRenderCount(prev => prev + 1)}>
              Re-render
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      })

      // Trigger re-render
      const reRenderButton = screen.getByText('Re-render')
      fireEvent.click(reRenderButton)

      // User should still be present
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('render-count')).toHaveTextContent('2')
      })
    })
  })

  describe('Auth State Change Integration', () => {
    it('should update UI when user signs in via auth state change', async () => {
      function AuthStateTestComponent() {
        const { user, loading } = require('../lib/auth-context').useAuth()
        
        if (loading) return <div data-testid="loading">Loading...</div>
        
        return (
          <div>
            <div data-testid="auth-status">
              {user ? `Signed in as ${user.email}` : 'Not signed in'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <AuthStateTestComponent />
        </AuthProvider>
      )

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not signed in')
      })

      // Simulate auth state change (user signs in)
      await act(async () => {
        authStateCallback(mockUser)
      })

      // Should update to show signed in user
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed in as test@example.com')
      })
    })

    it('should update UI when user signs out via auth state change', async () => {
      // Start with authenticated user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      function AuthStateTestComponent() {
        const { user, loading } = require('../lib/auth-context').useAuth()
        
        if (loading) return <div data-testid="loading">Loading...</div>
        
        return (
          <div>
            <div data-testid="auth-status">
              {user ? `Signed in as ${user.email}` : 'Not signed in'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <AuthStateTestComponent />
        </AuthProvider>
      )

      // Should start with signed in user
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed in as test@example.com')
      })

      // Simulate auth state change (user signs out)
      act(() => {
        authStateCallback(null)
      })

      // Should update to show signed out state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not signed in')
      })
    })
  })

  describe('Form Navigation Integration', () => {
    it('should switch between sign-up and sign-in forms', async () => {
      const user = userEvent.setup()
      
      function AuthFormsComponent() {
        const [currentForm, setCurrentForm] = React.useState<'signin' | 'signup'>('signin')
        
        return (
          <AuthProvider>
            {currentForm === 'signin' ? (
              <SignInForm onSwitchToSignUp={() => setCurrentForm('signup')} />
            ) : (
              <SignUpForm onSwitchToSignIn={() => setCurrentForm('signin')} />
            )}
          </AuthProvider>
        )
      }

      render(<AuthFormsComponent />)

      // Should start with sign-in form
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByTestId('switch-to-signup')).toBeInTheDocument()

      // Switch to sign-up form
      await user.click(screen.getByTestId('switch-to-signup'))

      // Should show sign-up form
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByTestId('switch-to-signin')).toBeInTheDocument()

      // Switch back to sign-in form
      await user.click(screen.getByTestId('switch-to-signin'))

      // Should show sign-in form again
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should navigate from sign-in to password reset form', async () => {
      const user = userEvent.setup()
      
      function AuthFormsComponent() {
        const [currentForm, setCurrentForm] = React.useState<'signin' | 'reset'>('signin')
        
        return (
          <AuthProvider>
            {currentForm === 'signin' ? (
              <SignInForm onForgotPassword={() => setCurrentForm('reset')} />
            ) : (
              <ResetPasswordForm onBackToSignIn={() => setCurrentForm('signin')} />
            )}
          </AuthProvider>
        )
      }

      render(<AuthFormsComponent />)

      // Should start with sign-in form
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()

      // Click forgot password link
      await user.click(screen.getByTestId('forgot-password-link'))

      // Should show reset password form
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
      expect(screen.getByTestId('back-to-signin')).toBeInTheDocument()

      // Go back to sign-in
      await user.click(screen.getByTestId('back-to-signin'))

      // Should show sign-in form again
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    })
  })

  describe('Error Recovery Integration', () => {
    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 }
      })

      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('signin-button')

      // Submit form with invalid credentials
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Invalid email or password. Please check your credentials and try again.'
        )
      })

      // Start typing in email field
      await user.clear(emailInput)
      await user.type(emailInput, 'new@example.com')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockSupabaseAuth.signInWithPassword.mockRejectedValue(
        new Error('Failed to fetch')
      )

      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('signin-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Network error. Please check your connection and try again.'
        )
      })
    })
  })
})