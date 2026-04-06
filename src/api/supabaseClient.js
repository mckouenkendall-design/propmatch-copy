import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkbelavlpydxsarzvpkl.supabase.co'
const supabaseAnonKey = 'sb_publishable_3fsEhgkzdIdSQ36jjV6Bdg_itekRWwb'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)