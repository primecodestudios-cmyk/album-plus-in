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
      contact_enquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      cpanel_user_data: {
        Row: {
          activation: number | null
          address: string | null
          block_user: number | null
          city: string | null
          cpanel_created: string | null
          cpanel_id: number | null
          created_at: string | null
          id: string
          note1: string | null
          note2: string | null
          pc_id: string | null
          running_version: string | null
          short_name: string | null
          studio_name: string | null
          sub_end: string | null
          sub_start: string | null
          system_info: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activation?: number | null
          address?: string | null
          block_user?: number | null
          city?: string | null
          cpanel_created?: string | null
          cpanel_id?: number | null
          created_at?: string | null
          id?: string
          note1?: string | null
          note2?: string | null
          pc_id?: string | null
          running_version?: string | null
          short_name?: string | null
          studio_name?: string | null
          sub_end?: string | null
          sub_start?: string | null
          system_info?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activation?: number | null
          address?: string | null
          block_user?: number | null
          city?: string | null
          cpanel_created?: string | null
          cpanel_id?: number | null
          created_at?: string | null
          id?: string
          note1?: string | null
          note2?: string | null
          pc_id?: string | null
          running_version?: string | null
          short_name?: string | null
          studio_name?: string | null
          sub_end?: string | null
          sub_start?: string | null
          system_info?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      device_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          device_id: string
          email: string
          id: string
          ip_address: string | null
          request_date: string
          software_version: string | null
          status: string
          system_name: string | null
          user_id: string
          windows_version: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          device_id: string
          email: string
          id?: string
          ip_address?: string | null
          request_date?: string
          software_version?: string | null
          status?: string
          system_name?: string | null
          user_id: string
          windows_version?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          device_id?: string
          email?: string
          id?: string
          ip_address?: string | null
          request_date?: string
          software_version?: string | null
          status?: string
          system_name?: string | null
          user_id?: string
          windows_version?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          is_active: boolean
          plan_name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          id?: string
          is_active?: boolean
          plan_name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          plan_name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psd_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          downloads_count: number
          file_size: string | null
          file_url: string | null
          id: string
          is_active: boolean
          is_free: boolean
          name: string
          pages: number
          photoshop_version: string | null
          preview_url: string | null
          price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          downloads_count?: number
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          name: string
          pages?: number
          photoshop_version?: string | null
          preview_url?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          downloads_count?: number
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          name?: string
          pages?: number
          photoshop_version?: string | null
          preview_url?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_downloads: {
        Row: {
          downloaded_at: string
          id: string
          template_id: string
          template_name: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          template_id: string
          template_name: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          template_id?: string
          template_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_licenses: {
        Row: {
          created_at: string
          device_id: string | null
          expires_at: string
          id: string
          is_active: boolean
          license_key: string | null
          max_devices: number
          plan_name: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          expires_at: string
          id?: string
          is_active?: boolean
          license_key?: string | null
          max_devices?: number
          plan_name: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          license_key?: string | null
          max_devices?: number
          plan_name?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          price: number
          purchased_at: string
          template_id: string
          template_name: string
          user_id: string
        }
        Insert: {
          id?: string
          price?: number
          purchased_at?: string
          template_id: string
          template_name: string
          user_id: string
        }
        Update: {
          id?: string
          price?: number
          purchased_at?: string
          template_id?: string
          template_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_license: {
        Args: { _device_id: string; _license_key: string }
        Returns: Json
      }
      generate_license_key: { Args: never; Returns: string }
      get_admin_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
