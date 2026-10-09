import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vwlxxkaisnhlxovklhga.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C0Rvp3DqdTwLC4hWRiBAyQ_0eoIfGsz'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
