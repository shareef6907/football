import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Predefined team members
export const TEAM_MEMBERS = [
  'Ahmed', 'Fasin', 'Hamsheed', 'Jalal', 'Shareef', 'Shaheen', 
  'Emaad', 'Darwish', 'Luqman', 'Nabeel', 'Jinish', 'Afzal', 
  'Rathul', 'Madan', 'Waleed', 'Ahmed-Ateeq', 'Junaid', 
  'Shafeer', 'Fathah', 'Nithin'
]

// Admin credentials
export const ADMIN_CREDENTIALS = {
  username: 'admin_captain',
  password: 'FootballStats2025!',
  email: 'admin@thursdayfootball.com'
}