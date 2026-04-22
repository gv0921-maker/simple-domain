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
      crm_activities: {
        Row: {
          attachments: Json | null
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          mentions: Json | null
          priority: Database["public"]["Enums"]["lead_priority"] | null
          related_id: string
          related_to: string
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          attachments?: Json | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          mentions?: Json | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          related_id: string
          related_to?: string
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Update: {
          attachments?: Json | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          mentions?: Json | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          related_id?: string
          related_to?: string
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      crm_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          resource: string
          resource_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          resource: string
          resource_id?: string | null
          user_id?: string
          user_name?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          resource?: string
          resource_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      crm_companies: {
        Row: {
          addresses: Json | null
          annual_revenue: number | null
          assigned_to: string | null
          created_at: string
          email: string | null
          employee_count: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          parent_company_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          addresses?: Json | null
          annual_revenue?: number | null
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          parent_company_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          addresses?: Json | null
          annual_revenue?: number | null
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          parent_company_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          addresses: Json | null
          assigned_to: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          custom_fields: Json | null
          department: string | null
          email: string | null
          emails: Json | null
          first_name: string
          gstin: string | null
          id: string
          job_title: string | null
          last_name: string
          notes: string | null
          parent_contact_id: string | null
          phone: string | null
          phones: Json | null
          score: number
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[] | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          addresses?: Json | null
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          custom_fields?: Json | null
          department?: string | null
          email?: string | null
          emails?: Json | null
          first_name?: string
          gstin?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          notes?: string | null
          parent_contact_id?: string | null
          phone?: string | null
          phones?: Json | null
          score?: number
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          addresses?: Json | null
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          custom_fields?: Json | null
          department?: string | null
          email?: string | null
          emails?: Json | null
          first_name?: string
          gstin?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          notes?: string | null
          parent_contact_id?: string | null
          phone?: string | null
          phones?: Json | null
          score?: number
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_parent_contact_id_fkey"
            columns: ["parent_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          company_name: string | null
          contact_id: string | null
          contact_name: string
          converted_at: string | null
          converted_to_opportunity_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expected_revenue: number
          id: string
          lost_reason: string | null
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          probability: number
          qualified_at: string | null
          score: number
          source: Database["public"]["Enums"]["lead_source"]
          source_detail: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string
          converted_at?: string | null
          converted_to_opportunity_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_revenue?: number
          id?: string
          lost_reason?: string | null
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          probability?: number
          qualified_at?: string | null
          score?: number
          source?: Database["public"]["Enums"]["lead_source"]
          source_detail?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string
          converted_at?: string | null
          converted_to_opportunity_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_revenue?: number
          id?: string
          lost_reason?: string | null
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          probability?: number
          qualified_at?: string | null
          score?: number
          source?: Database["public"]["Enums"]["lead_source"]
          source_detail?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          mentions: Json | null
          related_id: string
          related_to: string
          updated_at: string
          user_id: string
          user_name: string
          visibility: Database["public"]["Enums"]["note_visibility"]
        }
        Insert: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          mentions?: Json | null
          related_id: string
          related_to?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          mentions?: Json | null
          related_id?: string
          related_to?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Relationships: []
      }
      crm_opportunities: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          company_name: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          expected_close_date: string | null
          expected_revenue: number
          id: string
          internal_notes: string | null
          lost_at: string | null
          lost_reason: string | null
          name: string
          notes: string | null
          phone: string | null
          pipeline_id: string
          priority: number
          probability: number
          products: Json | null
          sales_team: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          stage_id: string
          tags: string[] | null
          team_id: string | null
          updated_at: string
          won_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          expected_close_date?: string | null
          expected_revenue?: number
          id?: string
          internal_notes?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_id: string
          priority?: number
          probability?: number
          products?: Json | null
          sales_team?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_id?: string
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string
          won_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          expected_close_date?: string | null
          expected_revenue?: number
          id?: string
          internal_notes?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_id?: string
          priority?: number
          probability?: number
          products?: Json | null
          sales_team?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_id?: string
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          automation_hooks: Json | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          order: number
          pipeline_id: string
          probability: number
          updated_at: string
        }
        Insert: {
          automation_hooks?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order?: number
          pipeline_id: string
          probability?: number
          updated_at?: string
        }
        Update: {
          automation_hooks?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
          pipeline_id?: string
          probability?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
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
      activity_type:
        | "call"
        | "email"
        | "meeting"
        | "task"
        | "note"
        | "follow_up"
      contact_status: "active" | "archived"
      contact_type: "individual" | "company"
      lead_priority: "low" | "medium" | "high" | "urgent"
      lead_source:
        | "website"
        | "referral"
        | "social_media"
        | "trade_show"
        | "cold_call"
        | "email_campaign"
        | "import"
        | "manual"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "converted"
        | "lost"
      note_visibility: "private" | "team" | "public"
      opportunity_stage: "new" | "qualified" | "proposition" | "won" | "lost"
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
      activity_type: ["call", "email", "meeting", "task", "note", "follow_up"],
      contact_status: ["active", "archived"],
      contact_type: ["individual", "company"],
      lead_priority: ["low", "medium", "high", "urgent"],
      lead_source: [
        "website",
        "referral",
        "social_media",
        "trade_show",
        "cold_call",
        "email_campaign",
        "import",
        "manual",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "unqualified",
        "converted",
        "lost",
      ],
      note_visibility: ["private", "team", "public"],
      opportunity_stage: ["new", "qualified", "proposition", "won", "lost"],
    },
  },
} as const
