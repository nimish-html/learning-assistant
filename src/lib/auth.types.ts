import type { User, Session, AuthError } from '@supabase/supabase-js'

// Re-export Supabase auth types for consistency
export type { User, Session, AuthError }

// Authentication context type
export interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

// Authentication form data types
export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface ResetPasswordFormData {
  email: string
}

// Authentication error types
export interface AuthErrorResponse {
  message: string
  code?: string
}

// Authentication state type
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}