import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://udkjwlqhsxxzukgsuslr.supabase.co';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka2p3bHFoc3h4enVrZ3N1c2xyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE3NTg4MCwiZXhwIjoyMTAzNzUxODgwfQ.F3MfTiEDYy0HRNMVoYMQe8C1vR3KBIqd-1ev1pHuU1s';

// Server-side Supabase admin client with full administrative privileges (bypasses RLS).
// SECURITY: This module must NEVER be imported in 'use client' components or client-side code.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabaseAdmin;
