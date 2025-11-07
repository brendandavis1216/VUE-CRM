import { AuthApiError } from '@supabase/supabase-js';

export function handleAuthError(error: unknown): string {
  if (error instanceof AuthApiError) {
    // Supabase specific auth errors
    return error.message;
  } else if (error instanceof Error) {
    // General JavaScript errors
    return error.message;
  }
  // Fallback for unknown error types
  return 'An unexpected authentication error occurred.';
}