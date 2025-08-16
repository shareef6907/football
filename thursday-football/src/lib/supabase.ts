import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database type definitions
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          display_name: string
          email: string
          is_admin: boolean
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          email: string
          is_admin?: boolean
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          display_name?: string
          email?: string
          is_admin?: boolean
          total_points?: number
          updated_at?: string
        }
      }
      form_status: {
        Row: {
          id: string
          user_id: string
          status: 'injured' | 'slightly_injured' | 'full_form' | 'peak_form'
          updated_at: string
        }
        Insert: {
          user_id: string
          status: 'injured' | 'slightly_injured' | 'full_form' | 'peak_form'
        }
        Update: {
          status?: 'injured' | 'slightly_injured' | 'full_form' | 'peak_form'
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          game_date: string
          team_a_players: string[]
          team_b_players: string[]
          team_a_score: number
          team_b_score: number
          winning_team: 'A' | 'B' | 'D'
          game_type: '5v5' | '6v6'
          verified: boolean
          created_at: string
        }
        Insert: {
          game_date: string
          team_a_players: string[]
          team_b_players: string[]
          team_a_score?: number
          team_b_score?: number
          winning_team?: 'A' | 'B' | 'D'
          game_type?: '5v5' | '6v6'
          verified?: boolean
        }
        Update: {
          game_date?: string
          team_a_players?: string[]
          team_b_players?: string[]
          team_a_score?: number
          team_b_score?: number
          winning_team?: 'A' | 'B' | 'D'
          game_type?: '5v5' | '6v6'
          verified?: boolean
        }
      }
      player_stats: {
        Row: {
          id: string
          game_id: string
          user_id: string
          goals: number
          assists: number
          saves: number
          points_earned: number
          team: 'A' | 'B'
          confirmed_by: string[]
          verification_count: number
          verified: boolean
          created_at: string
        }
        Insert: {
          game_id: string
          user_id: string
          goals?: number
          assists?: number
          saves?: number
          points_earned?: number
          team: 'A' | 'B'
          confirmed_by?: string[]
          verification_count?: number
          verified?: boolean
        }
        Update: {
          goals?: number
          assists?: number
          saves?: number
          points_earned?: number
          confirmed_by?: string[]
          verification_count?: number
          verified?: boolean
        }
      }
      peer_ratings: {
        Row: {
          id: string
          rater_id: string
          rated_user_id: string
          rating: number
          month_year: string
          created_at: string
        }
        Insert: {
          rater_id: string
          rated_user_id: string
          rating: number
          month_year: string
        }
        Update: {
          rating?: number
        }
      }
      monthly_awards: {
        Row: {
          id: string
          user_id: string
          award_type: 'player_of_month' | 'top_goal_scorer' | 'most_assists'
          month_year: string
          win_count: number
          created_at: string
        }
        Insert: {
          user_id: string
          award_type: 'player_of_month' | 'top_goal_scorer' | 'most_assists'
          month_year: string
          win_count?: number
        }
        Update: {
          win_count?: number
        }
      }
      teams: {
        Row: {
          id: string
          team_a_players: string[]
          team_b_players: string[]
          team_a_avg_rating: number
          team_b_avg_rating: number
          balance_score: number
          game_type: '5v5' | '6v6'
          used_in_game_id: string | null
          created_at: string
        }
        Insert: {
          team_a_players: string[]
          team_b_players: string[]
          team_a_avg_rating?: number
          team_b_avg_rating?: number
          balance_score?: number
          game_type?: '5v5' | '6v6'
          used_in_game_id?: string | null
        }
        Update: {
          used_in_game_id?: string | null
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_title: string
          achievement_description: string | null
          achieved_at: string
          game_id: string | null
        }
        Insert: {
          user_id: string
          achievement_type: string
          achievement_title: string
          achievement_description?: string | null
          game_id?: string | null
        }
        Update: {
          achievement_description?: string | null
        }
      }
    }
  }
}