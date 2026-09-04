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
          user_id_code: string | null
          push_subscription: Json | null
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
          user_id_code?: string | null
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
          user_id_code?: string | null
          push_subscription?: Json | null
          updated_at?: string
        }
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
      }
      // ── Workout plan header ──────────────────────────────────────────────
      routine_plans: {
        Row: {
          id: string
          member_id: string
          trainer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          trainer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
      }
      routines: {
        Row: {
          id: string
          plan_id: string | null          // FK → routine_plans.id
          member_id: string
          trainer_id: string
          day_label: string
          exercise_db_id: string
          exercise_name: string           // snapshot / display cache
          sets: number
          reps: string
          notes: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          plan_id?: string | null
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
      }
      // ── Diet plan header ─────────────────────────────────────────────────
      diet_plan_headers: {
        Row: {
          id: string
          member_id: string
          trainer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          trainer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
      }
      diet_plans: {
        Row: {
          id: string
          plan_id: string | null          // FK → diet_plan_headers.id
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
          plan_id?: string | null
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
      }
      // ── Routine template header ──────────────────────────────────────────
      routine_templates: {
        Row: {
          id: string
          trainer_id: string
          name: string
          description: string | null
          // exercises column removed — now stored in routine_template_exercises
          created_at: string
        }
        Insert: {
          id?: string
          trainer_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      // ── Routine template exercises (child rows) ──────────────────────────
      routine_template_exercises: {
        Row: {
          id: string
          template_id: string             // FK → routine_templates.id
          exercise_db_id: string
          exercise_name: string
          body_part: string | null
          equipment: string | null
          target: string | null
          gif_url: string | null
          sets: number
          reps: string
          notes: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          exercise_db_id: string
          exercise_name: string
          body_part?: string | null
          equipment?: string | null
          target?: string | null
          gif_url?: string | null
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
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          exercise_db_id: string
          exercise_name: string           // snapshot / display cache
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
