import { createClient } from '@supabase/supabase-js';

// Define the Game type for TypeScript
export interface Game {
  id?: string;
  title: string;
  description: string;
  code: string;
  author_id: string;
  author_username: string;
  created_at?: string;
  updated_at?: string;
}

// Create a function to get the Supabase client
export function getSupabaseClient() {
  // For server-side (Robo.js), use process.env
  // For client-side (Vite), use import.meta.env
  const supabaseUrl = typeof process !== 'undefined' && process.env 
    ? process.env.SUPABASE_URL 
    : import.meta.env.VITE_SUPABASE_URL;
    
  const supabaseAnonKey = typeof process !== 'undefined' && process.env 
    ? process.env.SUPABASE_ANON_KEY 
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing. Please check your environment variables.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Export a lazy-loaded client for direct imports
export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
  auth: {
    getUser: () => getSupabaseClient().auth.getUser(),
    // Add other auth methods as needed
  },
  // Add other Supabase methods as needed
};