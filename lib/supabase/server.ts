import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper to check if user is logged in
export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Helper to get current user profile
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, players(*)')
    .eq('google_id', user.id)
    .single()
    
  return profile
}

// Check if user is linked to a player
export async function isPlayerLinked(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('player_id')
    .eq('google_id', userId)
    .single()
    
  return !!profile?.player_id
}

// Get linked player for user
export async function getLinkedPlayer(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, players(*)')
    .eq('google_id', userId)
    .single()
    
  return profile?.players
}