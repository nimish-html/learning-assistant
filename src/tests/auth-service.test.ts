/**
 * Authentication Service Tests
 * 
 * Comprehensive unit tests for the AuthService class covering all core methods,
 * error handling, and edge cases.
 */

import { AuthService } from '../lib/auth-service'
import { supabase } from '../lib/supabase'
import type { AuthError, User } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  }
}))

// Mock window.location
const mockLocation = {
  origin: 'http://localhost'
}

// Mock window object for tests
;(global as any).window = {
  location: mockLocation
}

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      confirmation_sent_at: '2024-01-01T00:00:00Z'
    }

    it('should successfully sign up a user with valid credentials', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await AuthService.signUp('test@example.com', 'password123')

      expect(result).toEqual(mockUser)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost/auth/callback'
        }
      })
    })

    it('should normalize email to lowercase and trim whitespace', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      await AuthService.signUp('  TEST@EXAMPLE.COM  ', 'password123')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost/auth/callback'
        }
      })
    })

    it('should throw error for invalid email', async () => {
      await expect(AuthService.signUp('invalid-email', 'password123'))
        .rejects.toThrow('Please provide a valid email address')

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should throw error for empty email', async () => {
      await expect(AuthService.signUp('', 'password123'))
        .rejects.toThrow('Please provide a valid email address')

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should throw error for password shorter than 8 characters', async () => {
      await expect(AuthService.signUp('test@example.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long')

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should throw error for empty password', async () => {
      await expect(AuthService.signUp('test@example.com', ''))
        .rejects.toThrow('Password must be at least 8 characters long')

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle Supabase auth errors', async () => {
      const authError: AuthError = {
        message: 'User already registered',
        status: 400
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      await expect(AuthService.signUp('test@example.com', 'password123'))
        .rejects.toThrow('An account with this email already exists. Please sign in instead.')
    })

    it('should throw error when user creation fails', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      await expect(AuthService.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Failed to create user account')
    })
  })

  describe('signIn', () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    }

    it('should successfully sign in a user with valid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await AuthService.signIn('test@example.com', 'password123')

      expect(result).toEqual(mockUser)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should normalize email to lowercase and trim whitespace', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      await AuthService.signIn('  TEST@EXAMPLE.COM  ', 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should throw error for invalid email', async () => {
      await expect(AuthService.signIn('invalid-email', 'password123'))
        .rejects.toThrow('Please provide a valid email address')

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should throw error for empty password', async () => {
      await expect(AuthService.signIn('test@example.com', ''))
        .rejects.toThrow('Password is required')

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should handle invalid credentials error', async () => {
      const authError: AuthError = {
        message: 'Invalid login credentials',
        status: 400
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      await expect(AuthService.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid email or password. Please check your credentials and try again.')
    })

    it('should handle email not confirmed error', async () => {
      const authError: AuthError = {
        message: 'Email not confirmed',
        status: 400
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      await expect(AuthService.signIn('test@example.com', 'password123'))
        .rejects.toThrow('Please check your email and click the confirmation link before signing in.')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await expect(AuthService.signOut()).resolves.toBeUndefined()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const authError: AuthError = {
        message: 'Network error',
        status: 500
      }

      mockSupabase.auth.signOut.mockResolvedValue({ error: authError })

      await expect(AuthService.signOut())
        .rejects.toThrow('Network error. Please check your connection and try again.')
    })
  })

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await expect(AuthService.resetPassword('test@example.com')).resolves.toBeUndefined()
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost/auth/reset-password'
        }
      )
    })

    it('should normalize email to lowercase and trim whitespace', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await AuthService.resetPassword('  TEST@EXAMPLE.COM  ')

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost/auth/reset-password'
        }
      )
    })

    it('should throw error for invalid email', async () => {
      await expect(AuthService.resetPassword('invalid-email'))
        .rejects.toThrow('Please provide a valid email address')

      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('should throw error for empty email', async () => {
      await expect(AuthService.resetPassword(''))
        .rejects.toThrow('Please provide a valid email address')

      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('should handle reset password errors', async () => {
      const authError: AuthError = {
        message: 'Too many requests',
        status: 429
      }

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: authError })

      await expect(AuthService.resetPassword('test@example.com'))
        .rejects.toThrow('Too many attempts. Please wait a moment before trying again.')
    })
  })

  describe('getCurrentUser', () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated'
    }

    it('should return current user when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toEqual(mockUser)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toBeNull()
    })

    it('should return null on error and log warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const authError: AuthError = {
        message: 'Invalid token',
        status: 401
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: authError
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error getting current user:', authError)
      
      consoleSpy.mockRestore()
    })
  })

  describe('getCurrentSession', () => {
    it('should return current session when authenticated', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as User
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await AuthService.getCurrentSession()

      expect(result).toEqual(mockSession)
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('should return null when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await AuthService.getCurrentSession()

      expect(result).toBeNull()
    })
  })

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()
      const mockSubscription = { unsubscribe: mockUnsubscribe }

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription }
      })

      const unsubscribe = AuthService.onAuthStateChange(mockCallback)

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe('function')

      // Test unsubscribe function
      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should call callback with user when auth state changes', () => {
      const mockCallback = jest.fn()
      const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated'
      }

      let authStateCallback: (event: string, session: any) => void

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        }
      })

      AuthService.onAuthStateChange(mockCallback)

      // Simulate auth state change with session
      authStateCallback('SIGNED_IN', { user: mockUser })
      expect(mockCallback).toHaveBeenCalledWith(mockUser)

      // Simulate auth state change without session
      authStateCallback('SIGNED_OUT', null)
      expect(mockCallback).toHaveBeenCalledWith(null)
    })
  })

  describe('error message mapping', () => {
    it('should map various Supabase error messages to user-friendly messages', async () => {
      const errorMappings = [
        {
          supabaseMessage: 'Invalid login credentials',
          expectedMessage: 'Invalid email or password. Please check your credentials and try again.'
        },
        {
          supabaseMessage: 'Email not confirmed',
          expectedMessage: 'Please check your email and click the confirmation link before signing in.'
        },
        {
          supabaseMessage: 'User already registered',
          expectedMessage: 'An account with this email already exists. Please sign in instead.'
        },
        {
          supabaseMessage: 'Password should be at least 8 characters',
          expectedMessage: 'Password must be at least 8 characters long.'
        },
        {
          supabaseMessage: 'Invalid email format',
          expectedMessage: 'Please provide a valid email address.'
        },
        {
          supabaseMessage: 'Too many requests',
          expectedMessage: 'Too many attempts. Please wait a moment before trying again.'
        },
        {
          supabaseMessage: 'Network connection failed',
          expectedMessage: 'Network error. Please check your connection and try again.'
        }
      ]

      for (const { supabaseMessage, expectedMessage } of errorMappings) {
        const authError: AuthError = {
          message: supabaseMessage,
          status: 400
        }

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: authError
        })

        await expect(AuthService.signIn('test@example.com', 'password123'))
          .rejects.toThrow(expectedMessage)
      }
    })

    it('should return original message for unmapped errors', async () => {
      const authError: AuthError = {
        message: 'Some unknown error occurred',
        status: 500
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      await expect(AuthService.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Some unknown error occurred')
    })
  })
})