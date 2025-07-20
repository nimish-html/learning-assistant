/**
 * Saved Results Service with Performance Optimizations
 * 
 * This service provides CRUD operations for saved question results using Supabase.
 * It handles saving, retrieving, updating, and deleting user's generated questions
 * with proper error handling, data validation, type safety, and performance optimizations
 * including caching and query optimization.
 */

import { getSupabaseClient } from './supabase'
import { 
  SavedResult, 
  SaveResultsPayload, 
  SavedResultSchema, 
  SaveResultsPayloadSchema 
} from './schema'
import type { PostgrestError } from '@supabase/supabase-js'

// Simple in-memory cache for user results
interface CacheEntry {
  data: SavedResult[]
  timestamp: number
  userId: string
}

class ResultsCache {
  private cache = new Map<string, CacheEntry>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  get(userId: string): SavedResult[] | null {
    const entry = this.cache.get(userId)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(userId)
      return null
    }
    
    return entry.data
  }

  set(userId: string, data: SavedResult[]): void {
    this.cache.set(userId, {
      data: [...data], // Create a copy to prevent mutations
      timestamp: Date.now(),
      userId
    })
  }

  invalidate(userId: string): void {
    this.cache.delete(userId)
  }

  clear(): void {
    this.cache.clear()
  }
}

const resultsCache = new ResultsCache()

export interface SavedResultsServiceError {
  message: string
  code?: string
  originalError?: PostgrestError
}

export class SavedResultsService {
  /**
   * Save generated questions and metadata for a user
   * @param payload - The questions and metadata to save
   * @param userId - The authenticated user's ID
   * @returns The saved result record
   * @throws {Error} When save operation fails
   */
  static async saveResults(payload: SaveResultsPayload, userId: string): Promise<SavedResult> {
    // Validate input payload
    const validationResult = SaveResultsPayloadSchema.safeParse(payload)
    if (!validationResult.success) {
      throw new Error(`Invalid payload: ${validationResult.error.issues.map(i => i.message).join(', ')}`)
    }

    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('saved_results')
        .insert({
          user_id: userId,
          title: payload.title.trim(),
          questions: payload.questions,
          metadata: payload.metadata
        })
        .select()
        .single()

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      if (!data) {
        throw new Error('Failed to save results - no data returned')
      }

      // Validate the returned data matches our schema
      const parsedResult = SavedResultSchema.safeParse(data)
      if (!parsedResult.success) {
        throw new Error('Invalid data format returned from database')
      }

      // Invalidate cache after successful save
      resultsCache.invalidate(userId)

      return parsedResult.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unexpected error occurred while saving results')
    }
  }

  /**
   * Retrieve all saved results for a specific user with caching
   * @param userId - The authenticated user's ID
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Array of saved results ordered by creation date (newest first)
   * @throws {Error} When retrieval fails
   */
  static async getUserResults(userId: string, forceRefresh = false): Promise<SavedResult[]> {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cachedResults = resultsCache.get(userId)
      if (cachedResults) {
        return cachedResults
      }
    }

    try {
      const supabase = getSupabaseClient()
      
      // Optimize query by selecting only necessary fields for list view
      const { data, error } = await supabase
        .from('saved_results')
        .select(`
          id,
          user_id,
          title,
          created_at,
          updated_at,
          metadata,
          questions
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100) // Reasonable limit to prevent large data transfers

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      if (!data) {
        const emptyResults: SavedResult[] = []
        resultsCache.set(userId, emptyResults)
        return emptyResults
      }

      // Validate each result matches our schema
      const validatedResults: SavedResult[] = []
      for (const item of data) {
        const parsedResult = SavedResultSchema.safeParse(item)
        if (parsedResult.success) {
          validatedResults.push(parsedResult.data)
        } else {
          console.warn('Invalid saved result data found:', item.id, parsedResult.error)
        }
      }

      // Cache the results
      resultsCache.set(userId, validatedResults)

      return validatedResults
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unexpected error occurred while retrieving results')
    }
  }

  /**
   * Retrieve a specific saved result by ID
   * @param resultId - The ID of the saved result
   * @param userId - The authenticated user's ID (for security)
   * @returns The saved result record
   * @throws {Error} When result not found or retrieval fails
   */
  static async getResultById(resultId: string, userId: string): Promise<SavedResult> {
    // Validate input
    if (!resultId || typeof resultId !== 'string') {
      throw new Error('Valid result ID is required')
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('saved_results')
        .select('*')
        .eq('id', resultId)
        .eq('user_id', userId) // Ensure user can only access their own results
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Saved result not found')
        }
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      if (!data) {
        throw new Error('Saved result not found')
      }

      // Validate the returned data matches our schema
      const parsedResult = SavedResultSchema.safeParse(data)
      if (!parsedResult.success) {
        throw new Error('Invalid data format returned from database')
      }

      return parsedResult.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unexpected error occurred while retrieving result')
    }
  }

  /**
   * Update a saved result's title
   * @param resultId - The ID of the saved result to update
   * @param userId - The authenticated user's ID (for security)
   * @param newTitle - The new title for the saved result
   * @returns The updated saved result record
   * @throws {Error} When update fails or result not found
   */
  static async updateResultTitle(resultId: string, userId: string, newTitle: string): Promise<SavedResult> {
    // Validate input
    if (!resultId || typeof resultId !== 'string') {
      throw new Error('Valid result ID is required')
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    if (!newTitle || typeof newTitle !== 'string' || newTitle.trim().length === 0) {
      throw new Error('Valid title is required')
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('saved_results')
        .update({ 
          title: newTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', resultId)
        .eq('user_id', userId) // Ensure user can only update their own results
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Saved result not found')
        }
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      if (!data) {
        throw new Error('Failed to update result - no data returned')
      }

      // Validate the returned data matches our schema
      const parsedResult = SavedResultSchema.safeParse(data)
      if (!parsedResult.success) {
        throw new Error('Invalid data format returned from database')
      }

      // Invalidate cache after successful update
      resultsCache.invalidate(userId)

      return parsedResult.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unexpected error occurred while updating result')
    }
  }

  /**
   * Delete a saved result
   * @param resultId - The ID of the saved result to delete
   * @param userId - The authenticated user's ID (for security)
   * @throws {Error} When deletion fails or result not found
   */
  static async deleteResult(resultId: string, userId: string): Promise<void> {
    // Validate input
    if (!resultId || typeof resultId !== 'string') {
      throw new Error('Valid result ID is required')
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('saved_results')
        .delete()
        .eq('id', resultId)
        .eq('user_id', userId) // Ensure user can only delete their own results

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      // Invalidate cache after successful deletion
      resultsCache.invalidate(userId)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unexpected error occurred while deleting result')
    }
  }

  /**
   * Get count of saved results for a user
   * @param userId - The authenticated user's ID
   * @returns Number of saved results
   * @throws {Error} When count operation fails
   */
  static async getUserResultsCount(userId: string): Promise<number> {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    try {
      const supabase = getSupabaseClient()
      const { count, error } = await supabase
        .from('saved_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        throw new Error(this.getHumanReadableErrorMessage(error))
      }

      return count || 0
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unexpected error occurred while counting results')
    }
  }

  /**
   * Convert Supabase error messages to user-friendly messages
   * @private
   */
  private static getHumanReadableErrorMessage(error: PostgrestError): string {
    const message = error.message.toLowerCase()

    if (error.code === '23505') {
      return 'A result with this title already exists. Please choose a different title.'
    }

    if (error.code === '23503') {
      return 'Invalid user reference. Please sign in again.'
    }

    if (error.code === 'PGRST116') {
      return 'The requested result was not found.'
    }

    if (message.includes('row level security')) {
      return 'You do not have permission to access this result.'
    }

    if (message.includes('connection')) {
      return 'Database connection error. Please try again.'
    }

    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }

    if (message.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }

    // Return original message if no specific mapping found
    return error.message
  }
}

export default SavedResultsService