import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[supabaseServer] NEXT_PUBLIC_SUPABASE_URL is not defined. ' +
    'Set it in your .env.local and Vercel environment variables.'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    '[supabaseServer] SUPABASE_SERVICE_ROLE_KEY is not defined. ' +
    'This key must ONLY be set as a server-side environment variable — ' +
    'NEVER prefixed with NEXT_PUBLIC_.'
  );
}

// Server-side Supabase admin client with full administrative privileges (bypasses RLS).
// SECURITY: This module must NEVER be imported in 'use client' components or client-side code.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabaseAdmin;
