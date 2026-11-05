import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gnpauzccwwndavoqddzv.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGF1emNjd3duZGF2b3FkZHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4ODkxMzIsImV4cCI6MjEwOTQ2NTEzMn0.SrDkM80MiyfXWeq-BKn9bJ2S9VVY-8ZIsttfEY85I4w'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

