export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      beef_schedule: {
        Row: {
          dow: number
        }
        Insert: {
          dow: number
        }
        Update: {
          dow?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          published: boolean
          slug: string
          sort: number
        }
        Insert: {
          id?: string
          name: string
          published?: boolean
          slug: string
          sort?: number
        }
        Update: {
          id?: string
          name?: string
          published?: boolean
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      closures: {
        Row: {
          closes: string | null
          id: string
          is_closed: boolean
          label: string
          on_date: string
          opens: string | null
        }
        Insert: {
          closes?: string | null
          id?: string
          is_closed?: boolean
          label: string
          on_date: string
          opens?: string | null
        }
        Update: {
          closes?: string | null
          id?: string
          is_closed?: boolean
          label?: string
          on_date?: string
          opens?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      hours: {
        Row: {
          closes: string | null
          dow: number
          is_closed: boolean
          opens: string | null
        }
        Insert: {
          closes?: string | null
          dow: number
          is_closed?: boolean
          opens?: string | null
        }
        Update: {
          closes?: string | null
          dow?: number
          is_closed?: boolean
          opens?: string | null
        }
        Relationships: []
      }
      menu_item_modifier_groups: {
        Row: {
          group_id: string
          item_id: string
        }
        Insert: {
          group_id: string
          item_id: string
        }
        Update: {
          group_id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          beef_only: boolean
          category_id: string
          description: string
          featured: boolean
          id: string
          image_alt: string
          image_src: string | null
          name: string
          price_cents: number
          price_is_placeholder: boolean
          published: boolean
          slug: string
          sold_out: boolean
          sort: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          beef_only?: boolean
          category_id: string
          description?: string
          featured?: boolean
          id?: string
          image_alt?: string
          image_src?: string | null
          name: string
          price_cents: number
          price_is_placeholder?: boolean
          published?: boolean
          slug: string
          sold_out?: boolean
          sort?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          beef_only?: boolean
          category_id?: string
          description?: string
          featured?: boolean
          id?: string
          image_alt?: string
          image_src?: string | null
          name?: string
          price_cents?: number
          price_is_placeholder?: boolean
          published?: boolean
          slug?: string
          sold_out?: boolean
          sort?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notify_channel"]
          enabled: boolean
          key: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["notify_channel"]
          enabled?: boolean
          key: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notify_channel"]
          enabled?: boolean
          key?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          id: string
          max_select: number
          min_select: number
          name: string
          sort: number
        }
        Insert: {
          id?: string
          max_select?: number
          min_select?: number
          name: string
          sort?: number
        }
        Update: {
          id?: string
          max_select?: number
          min_select?: number
          name?: string
          sort?: number
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          group_id: string
          id: string
          name: string
          price_delta_cents: number
          price_is_placeholder: boolean
          sold_out: boolean
          sort: number
        }
        Insert: {
          group_id: string
          id?: string
          name: string
          price_delta_cents?: number
          price_is_placeholder?: boolean
          sold_out?: boolean
          sort?: number
        }
        Update: {
          group_id?: string
          id?: string
          name?: string
          price_delta_cents?: number
          price_is_placeholder?: boolean
          sold_out?: boolean
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notify_channel"]
          created_at: string
          error: string | null
          id: string
          order_id: string | null
          provider_id: string | null
          recipient: string
          status: Database["public"]["Enums"]["notify_status"]
          subject: string
          template_key: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["notify_channel"]
          created_at?: string
          error?: string | null
          id?: string
          order_id?: string | null
          provider_id?: string | null
          recipient: string
          status?: Database["public"]["Enums"]["notify_status"]
          subject?: string
          template_key: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notify_channel"]
          created_at?: string
          error?: string | null
          id?: string
          order_id?: string | null
          provider_id?: string | null
          recipient?: string
          status?: Database["public"]["Enums"]["notify_status"]
          subject?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          modifier_id: string | null
          name_snapshot: string
          order_item_id: string
          price_delta_cents: number
        }
        Insert: {
          id?: string
          modifier_id?: string | null
          name_snapshot: string
          order_item_id: string
          price_delta_cents: number
        }
        Update: {
          id?: string
          modifier_id?: string | null
          name_snapshot?: string
          order_item_id?: string
          price_delta_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          item_id: string | null
          name_snapshot: string
          notes: string
          order_id: string
          qty: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          item_id?: string | null
          name_snapshot: string
          notes?: string
          order_id: string
          qty: number
          unit_price_cents: number
        }
        Update: {
          id?: string
          item_id?: string | null
          name_snapshot?: string
          notes?: string
          order_id?: string
          qty?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asap: boolean
          created_at: string
          customer_id: string
          id: string
          idempotency_key: string
          notes: string
          order_no: number
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_at: string
          public_token: string
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          asap?: boolean
          created_at?: string
          customer_id: string
          id?: string
          idempotency_key: string
          notes?: string
          order_no?: number
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_at: string
          public_token?: string
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          asap?: boolean
          created_at?: string
          customer_id?: string
          id?: string
          idempotency_key?: string
          notes?: string
          order_no?: number
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_at?: string
          public_token?: string
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author: string
          id: string
          published: boolean
          quote: string
          sort: number
          source: string
          verified: boolean
        }
        Insert: {
          author: string
          id?: string
          published?: boolean
          quote: string
          sort?: number
          source?: string
          verified?: boolean
        }
        Update: {
          author?: string
          id?: string
          published?: boolean
          quote?: string
          sort?: number
          source?: string
          verified?: boolean
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          beef_mode: Database["public"]["Enums"]["beef_mode"]
          doordash_url: string | null
          id: boolean
          instagram_url: string | null
          maps_url: string | null
          min_lead_minutes: number
          ordering_paused: boolean
          pause_message: string
          phone: string | null
          prep_minutes: number
          rating: number | null
          review_count: number | null
          slot_minutes: number
          tax_rate: number
          ubereats_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          beef_mode?: Database["public"]["Enums"]["beef_mode"]
          doordash_url?: string | null
          id?: boolean
          instagram_url?: string | null
          maps_url?: string | null
          min_lead_minutes?: number
          ordering_paused?: boolean
          pause_message?: string
          phone?: string | null
          prep_minutes?: number
          rating?: number | null
          review_count?: number | null
          slot_minutes?: number
          tax_rate?: number
          ubereats_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          beef_mode?: Database["public"]["Enums"]["beef_mode"]
          doordash_url?: string | null
          id?: boolean
          instagram_url?: string | null
          maps_url?: string | null
          min_lead_minutes?: number
          ordering_paused?: boolean
          pause_message?: string
          phone?: string | null
          prep_minutes?: number
          rating?: number | null
          review_count?: number | null
          slot_minutes?: number
          tax_rate?: number
          ubereats_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_id: string
          received_at: string
          type: string
        }
        Insert: {
          event_id: string
          received_at?: string
          type: string
        }
        Update: {
          event_id?: string
          received_at?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      beef_today: { Args: never; Returns: boolean }
      create_order: {
        Args: {
          p_asap: boolean
          p_email: string
          p_idempotency_key: string
          p_lines: Json
          p_name: string
          p_notes: string
          p_phone: string
          p_pickup_at: string
        }
        Returns: Json
      }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      mark_order_paid: {
        Args: {
          p_amount_cents: number
          p_event_id: string
          p_event_type: string
          p_order_id: string
          p_session_id: string
        }
        Returns: string
      }
      rate_limit_hit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "staff"
      beef_mode: "auto" | "on" | "off"
      notify_channel: "email" | "sms"
      notify_status: "queued" | "sent" | "failed" | "skipped"
      order_status:
        | "pending_payment"
        | "new"
        | "preparing"
        | "ready"
        | "picked_up"
        | "cancelled"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "staff"],
      beef_mode: ["auto", "on", "off"],
      notify_channel: ["email", "sms"],
      notify_status: ["queued", "sent", "failed", "skipped"],
      order_status: [
        "pending_payment",
        "new",
        "preparing",
        "ready",
        "picked_up",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const

