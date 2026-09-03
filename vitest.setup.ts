/**
 * vitest.setup.ts
 * ---------------
 * Runs before every test file.
 * Loads .env.local so NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
 * are available to integration tests without a running Next.js server.
 */
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });
