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
          status: 'active' | 'paused' | 'blocked'
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
          status?: 'active' | 'paused' | 'blocked'
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
          status?: 'active' | 'paused' | 'blocked'
          avatar_url?: string | null
          phone?: string | null
          user_id_code?: string | null
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
        Relationships: [
          {
            foreignKeyName: "requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "routine_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      // ── Routine template header ──────────────────────────────────────────
      routine_templates: {
        Row: {
          id: string
          trainer_id: string
          name: string
          description: string | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      gym_notices: {
        Row: {
          id: string
          title: string
          body: string
          type: 'info' | 'warning' | 'success'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          type?: 'info' | 'warning' | 'success'
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          type?: 'info' | 'warning' | 'success'
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
          created_at: string
        }
        Insert: {
          id?: string
          day_label: string
          open_time?: string
          close_time?: string
          is_closed?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          day_label?: string
          open_time?: string
          close_time?: string
          is_closed?: boolean
          display_order?: number
        }
        Relationships: []
      }
      // ── Gamification tables ──────────────────────────────────────────────
      exercise_logs: {
        Row: {
          id: string
          member_id: string
          trainer_id: string
          exercise_name: string
          exercise_db_id: string | null
          sets_completed: number
          reps_completed: string
          duration_mins: number | null
          notes: string | null
          status: 'pending' | 'approved' | 'rejected'
          points_awarded: number
          submitted_at: string
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          trainer_id: string
          exercise_name: string
          exercise_db_id?: string | null
          sets_completed?: number
          reps_completed?: string
          duration_mins?: number | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          points_awarded?: number
          submitted_at?: string
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          points_awarded?: number
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      member_points: {
        Row: {
          id: string
          member_id: string
          total_points: number
          weekly_points: number
          monthly_points: number
          streak_days: number
          last_activity_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          total_points?: number
          weekly_points?: number
          monthly_points?: number
          streak_days?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Update: {
          total_points?: number
          weekly_points?: number
          monthly_points?: number
          streak_days?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_points_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      point_transactions: {
        Row: {
          id: string
          member_id: string
          exercise_log_id: string | null
          points: number
          reason: string
          awarded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          exercise_log_id?: string | null
          points: number
          reason: string
          awarded_by?: string | null
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "point_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_exercise_log_id_fkey"
            columns: ["exercise_log_id"]
            isOneToOne: false
            referencedRelation: "exercise_logs"
            referencedColumns: ["id"]
          }
        ]
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon_emoji: string
          points_required: number
          badge_type: 'milestone' | 'streak' | 'special'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_emoji?: string
          points_required?: number
          badge_type?: 'milestone' | 'streak' | 'special'
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          icon_emoji?: string
          points_required?: number
          badge_type?: 'milestone' | 'streak' | 'special'
        }
        Relationships: []
      }
      member_badges: {
        Row: {
          id: string
          member_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          member_id: string
          badge_id: string
          earned_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
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
