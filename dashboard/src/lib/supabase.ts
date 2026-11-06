import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gnpauzccwwndavoqddzv.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_ANON_KEY && typeof window !== 'undefined') {
  console.warn('VITE_SUPABASE_ANON_KEY is missing from environment. Read operations may fail.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


