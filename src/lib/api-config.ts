/**
 * API Configuration Service
 * 
 * This utility provides centralized configuration for Supabase Edge Function URLs
 * used throughout the application. It generates the URLs based on environment
 * variables and provides validation to ensure the required variables are set.
 */

/**
 * API configuration interface defining the URLs for all Edge Functions
 */
export interface ApiConfig {
  generateQuestionsUrl: string;
  verifyQuestionsUrl: string;
  chatStreamUrl: string;
}

/**
 * Error thrown when required environment variables are missing
 */
export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that the required environment variables are set
 * @throws {EnvironmentError} If NEXT_PUBLIC_SUPABASE_URL is not set
 */
export function validateEnvironment(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new EnvironmentError(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
      'Please check your .env.local file or deployment environment.'
    );
  }
}

/**
 * Gets the base URL for Supabase Edge Functions
 * @returns The base URL for Supabase Edge Functions
 * @throws {EnvironmentError} If NEXT_PUBLIC_SUPABASE_URL is not set
 */
export function getSupabaseFunctionsBaseUrl(): string {
  validateEnvironment();
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
}

/**
 * Gets the API configuration with all Edge Function URLs
 * @returns {ApiConfig} Object containing all Edge Function URLs
 * @throws {EnvironmentError} If NEXT_PUBLIC_SUPABASE_URL is not set
 */
export function getApiConfig(): ApiConfig {
  const baseUrl = getSupabaseFunctionsBaseUrl();
  
  return {
    generateQuestionsUrl: `${baseUrl}/generate-questions`,
    verifyQuestionsUrl: `${baseUrl}/verify-questions`,
    chatStreamUrl: `${baseUrl}/chat-stream`,
  };
}

/**
 * Gets the standard headers for Supabase Edge Function requests
 * @returns Headers object with Authorization and apikey
 */
export function getSupabaseHeaders(): Record<string, string> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new EnvironmentError(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Please check your .env.local file or deployment environment.'
    );
  }
  
  return {
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey,
  };
}

/**
 * Default export of the API configuration
 * This allows for easy importing in components
 */
const apiConfig = getApiConfig();
export default apiConfig;