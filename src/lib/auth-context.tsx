/**
 * Authentication Context Provider
 * 
 * This context provider manages authentication state throughout the application.
 * It handles session persistence, automatic token refresh, and provides
 * authentication methods to child components.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService } from './auth-service'
import type { AuthContextType, User } from './auth.types'

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods
 * to all child components. Handles session persistence and automatic
 * token refresh through Supabase's built-in mechanisms.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize authentication state on mount
  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        if (mounted) {
          setUser(currentUser)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    })

    // Cleanup function
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // Sign up method
  const signUp = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    try {
      await AuthService.signUp(email, password)
      // User state will be updated via onAuthStateChange listener
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  // Sign in method
  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    try {
      await AuthService.signIn(email, password)
      // User state will be updated via onAuthStateChange listener
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  // Sign out method
  const signOut = async (): Promise<void> => {
    setLoading(true)
    try {
      await AuthService.signOut()
      // User state will be updated via onAuthStateChange listener
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  // Reset password method
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await AuthService.resetPassword(email)
    } catch (error) {
      throw error
    }
  }

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider