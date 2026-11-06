import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://gnpauzccwwndavoqddzv.supabase.co'

const FALLBACK_PUBLIC_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGF1emNjd3duZGF2b3FkZHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4ODkxMzIsImV4cCI6MjEwOTQ2NTEzMn0.SrDkM80MiyfXWeq-BKn9bJ2S9VVY-8ZIsttfEY85I4w'

const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_PUBLIC_ANON_KEY

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
