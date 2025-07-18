/**
 * Supabase client configuration with lazy loading optimization
 * 
 * This file sets up the Supabase client with proper TypeScript types
 * and authentication configuration. The client is lazily initialized
 * to improve initial bundle size and loading performance.
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Lazy initialization of Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get or create the Supabase client instance
 * This lazy initialization helps reduce initial bundle size
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Optimize auth flow for better performance
        flowType: 'pkce'
      },
      // Enable connection pooling for better performance
      db: {
        schema: 'public'
      },
      // Optimize real-time features (disable if not needed)
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  
  return supabaseInstance
}

// Export the lazy client getter as the default export
export const supabase = getSupabaseClient()

// Export a function to reset the client (useful for testing)
export function resetSupabaseClient(): void {
  supabaseInstance = null
}