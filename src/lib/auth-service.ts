/**
 * Authentication Service with Performance Optimizations
 * 
 * This service provides core authentication methods using Supabase Auth.
 * It handles user registration, login, logout, and password reset functionality
 * with proper error handling, type safety, and performance optimizations
 * including lazy loading of the Supabase client.
 */

import { getSupabaseClient } from './supabase'
import type { AuthError, User } from '@supabase/supabase-js'

export interface AuthServiceError {
  message: string
  code?: string
  originalError?: AuthError
}

export class AuthService {
  /**
   * Sign up a new user with email and password
   * @param email - User's email address
   * @param password - User's password (minimum 8 characters)
   * @throws {Error} When signup fails
   */
  static async signUp(email: string, password: string): Promise<User> {
    // Validate input
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address')
    }
    
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      if (!data.user) {
        throw new Error('Failed to create user account')
      }

      return data.user
    } catch (error) {
      if (this.isNetworkError(error)) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Sign in an existing user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @throws {Error} When signin fails
   */
  static async signIn(email: string, password: string): Promise<User> {
    // Validate input
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address')
    }
    
    if (!password) {
      throw new Error('Password is required')
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      if (!data.user) {
        throw new Error('Failed to sign in')
      }

      return data.user
    } catch (error) {
      if (this.isNetworkError(error)) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Sign out the current user
   * @throws {Error} When signout fails
   */
  static async signOut(): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }
    } catch (error) {
      if (this.isNetworkError(error)) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Send password reset email to user
   * @param email - User's email address
   * @throws {Error} When password reset fails
   */
  static async resetPassword(email: string): Promise<void> {
    // Validate input
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address')
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      )

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }
    } catch (error) {
      if (this.isNetworkError(error)) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Get the current authenticated user
   * @returns Current user or null if not authenticated
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = getSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.warn('Error getting current user:', error)
        return null
      }
      
      return user
    } catch (error) {
      console.warn('Unexpected error getting current user:', error)
      return null
    }
  }

  /**
   * Get the current session
   * @returns Current session or null if not authenticated
   */
  static async getCurrentSession() {
    try {
      const supabase = getSupabaseClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('Error getting current session:', error)
        return null
      }
      
      return session
    } catch (error) {
      console.warn('Unexpected error getting current session:', error)
      return null
    }
  }

  /**
   * Subscribe to authentication state changes
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }



  /**
   * Check if an error is network-related
   * @private
   */
  private static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';
    
    const networkErrorPatterns = [
      /network/i,
      /fetch/i,
      /connection/i,
      /timeout/i,
      /offline/i,
      /ERR_NETWORK/i,
      /ERR_INTERNET_DISCONNECTED/i,
      /Failed to fetch/i,
      /NetworkError/i,
      /net::/i,
    ];

    return networkErrorPatterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorName)
    ) || !navigator.onLine;
  }

  /**
   * Convert Supabase error messages to user-friendly messages
   * @private
   */
  private static getHumanReadableErrorMessage(error: AuthError): string {
    const message = error.message.toLowerCase()

    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.'
    }
    
    if (message.includes('user already registered')) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    
    if (message.includes('password should be at least')) {
      return 'Password must be at least 8 characters long.'
    }
    
    if (message.includes('invalid email')) {
      return 'Please provide a valid email address.'
    }
    
    if (message.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment before trying again.'
    }

    if (message.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }

    // Return original message if no specific mapping found
    return error.message
  }
}

export default AuthService