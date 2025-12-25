import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization.
 * Using provided project URL and updated publishable API key.
 */
const supabaseUrl = 'https://acqsjebtgjxvzbvsjukh.supabase.co';
const supabaseAnonKey = 'sb_publishable_LJlEOL5cgNVQ0CM4t1-3ow_DduWuhM5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);