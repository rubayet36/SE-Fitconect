export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'member' | 'trainer' | 'owner'
          avatar_url: string | null
          phone: string | null
          push_subscription?: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'member' | 'trainer' | 'owner'
          avatar_url?: string | null
          phone?: string | null
          push_subscription?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'member' | 'trainer' | 'owner'
          avatar_url?: string | null
          phone?: string | null
          push_subscription?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          id: string
          member_id: string
          trainer_id: string
          request_type: 'diet' | 'workout' | 'both'
          status: 'pending' | 'in_progress' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          trainer_id: string
          request_type: 'diet' | 'workout' | 'both'
          status?: 'pending' | 'in_progress' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'in_progress' | 'completed'
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          member_id: string
          trainer_id: string
          day_label: string
          exercise_db_id: string
          exercise_name: string
          sets: number
          reps: string
          notes: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          trainer_id: string
          day_label: string
          exercise_db_id: string
          exercise_name: string
          sets?: number
          reps?: string
          notes?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          sets?: number
          reps?: string
          notes?: string | null
          order_index?: number
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          id: string
          member_id: string
          trainer_id: string
          meal_time: string
          food_items: string
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          trainer_id: string
          meal_time: string
          food_items: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          meal_time?: string
          food_items?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      routine_templates: {
        Row: {
          id: string
          trainer_id: string
          name: string
          description: string | null
          exercises: Json
          created_at: string
        }
        Insert: {
          id?: string
          trainer_id: string
          name: string
          description?: string | null
          exercises?: Json
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          exercises?: Json
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          exercise_db_id: string
          exercise_name: string
          exercise_gif: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_db_id: string
          exercise_name: string
          exercise_gif?: string | null
          created_at?: string
        }
        Update: Partial<{
          exercise_name: string
          exercise_gif: string | null
        }>
        Relationships: []
      }
      gym_notices: {
        Row: {
          id: string
          title: string
          body: string
          type: 'info' | 'warning' | 'success'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          type: 'info' | 'warning' | 'success'
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          type?: 'info' | 'warning' | 'success'
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      gym_timetable: {
        Row: {
          id: string
          day_label: string
          open_time: string
          close_time: string
          is_closed: boolean
          display_order: number
          updated_at: string
        }
        Insert: {
          id?: string
          day_label: string
          open_time?: string
          close_time?: string
          is_closed?: boolean
          display_order?: number
          updated_at?: string
        }
        Update: {
          id?: string
          day_label?: string
          open_time?: string
          close_time?: string
          is_closed?: boolean
          display_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      member_body_metrics: {
        Row: {
          id: string
          member_id: string
          recorded_at: string
          weight_kg: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          waist_cm: number | null
          biceps_cm: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          recorded_at?: string
          weight_kg?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          waist_cm?: number | null
          biceps_cm?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          recorded_at?: string
          weight_kg?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          waist_cm?: number | null
          biceps_cm?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      member_workout_logs: {
        Row: {
          id: string
          member_id: string
          logged_at: string
          exercise_name: string
          sets_completed: number
          reps_completed: string
          weight_kg: number | null
          is_pr: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          logged_at?: string
          exercise_name: string
          sets_completed?: number
          reps_completed?: string
          weight_kg?: number | null
          is_pr?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          logged_at?: string
          exercise_name?: string
          sets_completed?: number
          reps_completed?: string
          weight_kg?: number | null
          is_pr?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
