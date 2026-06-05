export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessment_attempts: {
        Row: {
          answers: Json
          assessment_id: string
          created_at: string
          id: string
          passed: boolean
          percentage: number
          score: number
          submitted_at: string
          total_marks: number
          user_id: string
        }
        Insert: {
          answers?: Json
          assessment_id: string
          created_at?: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          submitted_at?: string
          total_marks?: number
          user_id: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          submitted_at?: string
          total_marks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_answer: string
          created_at: string
          id: string
          marks: number
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          assessment_id: string
          correct_answer: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number
          question_text: string
          question_type?: string
        }
        Update: {
          assessment_id?: string
          correct_answer?: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          passing_marks: number
          published: boolean
          recommended_course_id: string | null
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          passing_marks?: number
          published?: boolean
          recommended_course_id?: string | null
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          passing_marks?: number
          published?: boolean
          recommended_course_id?: string | null
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_recommended_course_id_fkey"
            columns: ["recommended_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          assigned_to_all: boolean
          course_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          assigned_to_all?: boolean
          course_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          assigned_to_all?: boolean
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_progress: {
        Row: {
          created_at: string
          date: string
          id: string
          marks_earned: number
          streak_maintained: boolean
          tasks_completed: number
          total_tasks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          marks_earned?: number
          streak_maintained?: boolean
          tasks_completed?: number
          total_tasks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marks_earned?: number
          streak_maintained?: boolean
          tasks_completed?: number
          total_tasks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          attempts: Json
          completed: boolean
          created_at: string
          id: string
          lesson_id: string
          percentage: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: Json
          completed?: boolean
          created_at?: string
          id?: string
          lesson_id: string
          percentage?: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: Json
          completed?: boolean
          created_at?: string
          id?: string
          lesson_id?: string
          percentage?: number
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          order_index: number
          pdf_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          order_index?: number
          pdf_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          order_index?: number
          pdf_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          badges: string[] | null
          branch: string | null
          college: string | null
          created_at: string
          daily_target: number | null
          department: string | null
          email: string | null
          goal: string | null
          grammar_score: number | null
          id: string
          joined_date: string
          learning_path: string | null
          lessons_completed: number | null
          level: string | null
          name: string
          onboarding_complete: boolean | null
          phone: string | null
          placement_readiness_score: number | null
          speaking_score: number | null
          streak: number | null
          total_marks: number | null
          updated_at: string
          vocabulary_score: number | null
          year: string | null
        }
        Insert: {
          badges?: string[] | null
          branch?: string | null
          college?: string | null
          created_at?: string
          daily_target?: number | null
          department?: string | null
          email?: string | null
          goal?: string | null
          grammar_score?: number | null
          id: string
          joined_date?: string
          learning_path?: string | null
          lessons_completed?: number | null
          level?: string | null
          name?: string
          onboarding_complete?: boolean | null
          phone?: string | null
          placement_readiness_score?: number | null
          speaking_score?: number | null
          streak?: number | null
          total_marks?: number | null
          updated_at?: string
          vocabulary_score?: number | null
          year?: string | null
        }
        Update: {
          badges?: string[] | null
          branch?: string | null
          college?: string | null
          created_at?: string
          daily_target?: number | null
          department?: string | null
          email?: string | null
          goal?: string | null
          grammar_score?: number | null
          id?: string
          joined_date?: string
          learning_path?: string | null
          lessons_completed?: number | null
          level?: string | null
          name?: string
          onboarding_complete?: boolean | null
          phone?: string | null
          placement_readiness_score?: number | null
          speaking_score?: number | null
          streak?: number | null
          total_marks?: number | null
          updated_at?: string
          vocabulary_score?: number | null
          year?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_words: {
        Row: {
          favorite: boolean
          id: string
          learned: boolean
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          favorite?: boolean
          id?: string
          learned?: boolean
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          favorite?: boolean
          id?: string
          learned?: boolean
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_if_none: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_assessment: {
        Args: { _answers: Json; _assessment_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
    },
  },
} as const
