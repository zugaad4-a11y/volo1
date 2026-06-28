import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is missing from environment.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder-service-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
