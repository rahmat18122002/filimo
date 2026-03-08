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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string
          device_id: string
          display_name: string | null
          id: string
          is_vip: boolean
          vip_until: string | null
        }
        Insert: {
          created_at?: string
          device_id: string
          display_name?: string | null
          id?: string
          is_vip?: boolean
          vip_until?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string
          display_name?: string | null
          id?: string
          is_vip?: boolean
          vip_until?: string | null
        }
        Relationships: []
      }
      bot_channels: {
        Row: {
          channel_type: string
          chat_id: string
          created_at: string
          id: string
          invite_link: string | null
          is_active: boolean
          sort_order: number
          title: string
          username: string | null
        }
        Insert: {
          channel_type?: string
          chat_id: string
          created_at?: string
          id?: string
          invite_link?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
          username?: string | null
        }
        Update: {
          channel_type?: string
          chat_id?: string
          created_at?: string
          id?: string
          invite_link?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
          username?: string | null
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      bot_stats: {
        Row: {
          action: string
          created_at: string
          id: string
          movie_id: string | null
          telegram_user_id: string
          telegram_username: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          movie_id?: string | null
          telegram_user_id: string
          telegram_username?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          movie_id?: string | null
          telegram_user_id?: string
          telegram_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_stats_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          name_fa: string | null
          name_tg: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          name_fa?: string | null
          name_tg?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_fa?: string | null
          name_tg?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      episodes: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          is_free: boolean
          movie_id: string
          part_number: number
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          is_free?: boolean
          movie_id: string
          part_number: number
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          is_free?: boolean
          movie_id?: string
          part_number?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channels: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          sort_order: number
          source: string
          stream_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name: string
          sort_order?: number
          source?: string
          stream_url?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          sort_order?: number
          source?: string
          stream_url?: string
        }
        Relationships: []
      }
      movies: {
        Row: {
          created_at: string
          description: string
          description_en: string | null
          description_fa: string | null
          description_tg: string | null
          duration: string
          genre: string[]
          id: string
          is_featured: boolean
          poster: string
          rating: number
          sort_order: number
          title: string
          title_en: string | null
          title_fa: string | null
          title_tg: string | null
          trailer_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          description?: string
          description_en?: string | null
          description_fa?: string | null
          description_tg?: string | null
          duration?: string
          genre?: string[]
          id?: string
          is_featured?: boolean
          poster?: string
          rating?: number
          sort_order?: number
          title: string
          title_en?: string | null
          title_fa?: string | null
          title_tg?: string | null
          trailer_url?: string | null
          year?: number
        }
        Update: {
          created_at?: string
          description?: string
          description_en?: string | null
          description_fa?: string | null
          description_tg?: string | null
          duration?: string
          genre?: string[]
          id?: string
          is_featured?: boolean
          poster?: string
          rating?: number
          sort_order?: number
          title?: string
          title_en?: string | null
          title_fa?: string | null
          title_tg?: string | null
          trailer_url?: string | null
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          movie_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          movie_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          movie_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      slider_items: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          movie_id: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          movie_id?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          movie_id?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "slider_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          button_label: string | null
          button_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          image_url: string
          is_active: boolean
          movie_id: string | null
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          movie_id?: string | null
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          movie_id?: string | null
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_cards: {
        Row: {
          card_label: string | null
          card_number: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          card_label?: string | null
          card_number: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          card_label?: string | null
          card_number?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      vip_payments: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          reviewed_at: string | null
          screenshot_url: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          reviewed_at?: string | null
          screenshot_url: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          reviewed_at?: string | null
          screenshot_url?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "vip_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          months: number | null
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          months?: number | null
          price: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          months?: number | null
          price?: number
          sort_order?: number
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
    Enums: {},
  },
} as const
