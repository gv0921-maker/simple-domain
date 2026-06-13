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
      activity_log: {
        Row: {
          action_type: string
          changed_at: string
          changed_by: string
          deleted_at: string | null
          deleted_by: string | null
          field_name: string | null
          id: string
          is_deleted: boolean
          new_value: string | null
          note_text: string | null
          old_value: string | null
          record_id: string
          record_type: string
        }
        Insert: {
          action_type: string
          changed_at?: string
          changed_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          field_name?: string | null
          id?: string
          is_deleted?: boolean
          new_value?: string | null
          note_text?: string | null
          old_value?: string | null
          record_id: string
          record_type: string
        }
        Update: {
          action_type?: string
          changed_at?: string
          changed_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          field_name?: string | null
          id?: string
          is_deleted?: boolean
          new_value?: string | null
          note_text?: string | null
          old_value?: string | null
          record_id?: string
          record_type?: string
        }
        Relationships: []
      }
      adjustment_lines: {
        Row: {
          adjustment_id: string
          counted_qty: number
          created_at: string
          difference: number
          id: string
          lot_id: string | null
          product_id: string
          product_name: string
          product_sku: string
          serial_numbers: string[]
          theoretical_qty: number
          unit_cost: number
          updated_at: string
          value_difference: number
        }
        Insert: {
          adjustment_id: string
          counted_qty?: number
          created_at?: string
          difference?: number
          id?: string
          lot_id?: string | null
          product_id: string
          product_name: string
          product_sku: string
          serial_numbers?: string[]
          theoretical_qty?: number
          unit_cost?: number
          updated_at?: string
          value_difference?: number
        }
        Update: {
          adjustment_id?: string
          counted_qty?: number
          created_at?: string
          difference?: number
          id?: string
          lot_id?: string | null
          product_id?: string
          product_name?: string
          product_sku?: string
          serial_numbers?: string[]
          theoretical_qty?: number
          unit_cost?: number
          updated_at?: string
          value_difference?: number
        }
        Relationships: [
          {
            foreignKeyName: "adjustment_lines_adjustment_id_fkey"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "inventory_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_lines_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      app_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          resource: string
          resource_id: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          resource: string
          resource_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          resource?: string
          resource_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      app_role_permissions: {
        Row: {
          can_export: boolean
          can_import: boolean
          created_at: string
          id: string
          level: string
          module: string
          role_id: string
          scope: string
          updated_at: string
        }
        Insert: {
          can_export?: boolean
          can_import?: boolean
          created_at?: string
          id?: string
          level?: string
          module: string
          role_id: string
          scope?: string
          updated_at?: string
        }
        Update: {
          can_export?: boolean
          can_import?: boolean
          created_at?: string
          id?: string
          level?: string
          module?: string
          role_id?: string
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          inherits_from: string[]
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          inherits_from?: string[]
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          inherits_from?: string[]
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_attachments: {
        Row: {
          appraisal_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          appraisal_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          appraisal_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_attachments_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_criteria: {
        Row: {
          category: Database["public"]["Enums"]["appraisal_criterion_category"]
          created_at: string
          criterion_name: string
          description: string | null
          display_order: number
          id: string
          is_required: boolean
          rating_scale: Database["public"]["Enums"]["appraisal_rating_scale"]
          template_id: string
          weightage_percentage: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["appraisal_criterion_category"]
          created_at?: string
          criterion_name: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          rating_scale?: Database["public"]["Enums"]["appraisal_rating_scale"]
          template_id: string
          weightage_percentage?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["appraisal_criterion_category"]
          created_at?: string
          criterion_name?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          rating_scale?: Database["public"]["Enums"]["appraisal_rating_scale"]
          template_id?: string
          weightage_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_criteria_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "appraisal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          cycle_type: Database["public"]["Enums"]["appraisal_cycle_type"]
          hr_finalization_deadline: string | null
          id: string
          manager_review_end_date: string | null
          manager_review_start_date: string | null
          name: string
          period_end_date: string
          period_start_date: string
          self_review_end_date: string | null
          self_review_start_date: string | null
          status: Database["public"]["Enums"]["appraisal_cycle_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cycle_type?: Database["public"]["Enums"]["appraisal_cycle_type"]
          hr_finalization_deadline?: string | null
          id?: string
          manager_review_end_date?: string | null
          manager_review_start_date?: string | null
          name: string
          period_end_date: string
          period_start_date: string
          self_review_end_date?: string | null
          self_review_start_date?: string | null
          status?: Database["public"]["Enums"]["appraisal_cycle_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cycle_type?: Database["public"]["Enums"]["appraisal_cycle_type"]
          hr_finalization_deadline?: string | null
          id?: string
          manager_review_end_date?: string | null
          manager_review_start_date?: string | null
          name?: string
          period_end_date?: string
          period_start_date?: string
          self_review_end_date?: string | null
          self_review_start_date?: string | null
          status?: Database["public"]["Enums"]["appraisal_cycle_status"]
          updated_at?: string
        }
        Relationships: []
      }
      appraisal_goals: {
        Row: {
          achievement_notes: string | null
          appraisal_id: string
          completion_percentage: number
          created_at: string
          goal_description: string | null
          goal_title: string
          id: string
          priority: Database["public"]["Enums"]["appraisal_goal_priority"]
          status: Database["public"]["Enums"]["appraisal_goal_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          achievement_notes?: string | null
          appraisal_id: string
          completion_percentage?: number
          created_at?: string
          goal_description?: string | null
          goal_title: string
          id?: string
          priority?: Database["public"]["Enums"]["appraisal_goal_priority"]
          status?: Database["public"]["Enums"]["appraisal_goal_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          achievement_notes?: string | null
          appraisal_id?: string
          completion_percentage?: number
          created_at?: string
          goal_description?: string | null
          goal_title?: string
          id?: string
          priority?: Database["public"]["Enums"]["appraisal_goal_priority"]
          status?: Database["public"]["Enums"]["appraisal_goal_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_goals_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_ratings: {
        Row: {
          appraisal_id: string
          created_at: string
          criterion_id: string
          final_rating: number | null
          hr_comments: string | null
          id: string
          manager_comments: string | null
          manager_rating: number | null
          self_comments: string | null
          self_rating: number | null
          updated_at: string
          weighted_score: number | null
        }
        Insert: {
          appraisal_id: string
          created_at?: string
          criterion_id: string
          final_rating?: number | null
          hr_comments?: string | null
          id?: string
          manager_comments?: string | null
          manager_rating?: number | null
          self_comments?: string | null
          self_rating?: number | null
          updated_at?: string
          weighted_score?: number | null
        }
        Update: {
          appraisal_id?: string
          created_at?: string
          criterion_id?: string
          final_rating?: number | null
          hr_comments?: string | null
          id?: string
          manager_comments?: string | null
          manager_rating?: number | null
          self_comments?: string | null
          self_rating?: number | null
          updated_at?: string
          weighted_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_ratings_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_ratings_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "appraisal_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_templates: {
        Row: {
          applies_to: Database["public"]["Enums"]["appraisal_template_scope"]
          applies_to_filter_json: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["appraisal_template_scope"]
          applies_to_filter_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["appraisal_template_scope"]
          applies_to_filter_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      appraisals: {
        Row: {
          appraisal_cycle_id: string
          areas_of_improvement: string | null
          created_at: string
          employee_acknowledged_at: string | null
          employee_acknowledgement: boolean
          employee_id: string
          employee_response: string | null
          final_overall_rating: number | null
          hr_comments: string | null
          hr_finalized_at: string | null
          hr_reviewer_id: string | null
          id: string
          increment_percentage_recommended: number | null
          manager_comments: string | null
          manager_overall_rating: number | null
          manager_review_submitted_at: string | null
          promotion_recommended_designation: string | null
          recommendation:
            | Database["public"]["Enums"]["appraisal_recommendation"]
            | null
          reviewer_2_id: string | null
          reviewer_id: string | null
          self_overall_rating: number | null
          self_review_submitted_at: string | null
          status: Database["public"]["Enums"]["appraisal_status"]
          strengths: string | null
          template_id: string | null
          training_recommendations: string | null
          updated_at: string
        }
        Insert: {
          appraisal_cycle_id: string
          areas_of_improvement?: string | null
          created_at?: string
          employee_acknowledged_at?: string | null
          employee_acknowledgement?: boolean
          employee_id: string
          employee_response?: string | null
          final_overall_rating?: number | null
          hr_comments?: string | null
          hr_finalized_at?: string | null
          hr_reviewer_id?: string | null
          id?: string
          increment_percentage_recommended?: number | null
          manager_comments?: string | null
          manager_overall_rating?: number | null
          manager_review_submitted_at?: string | null
          promotion_recommended_designation?: string | null
          recommendation?:
            | Database["public"]["Enums"]["appraisal_recommendation"]
            | null
          reviewer_2_id?: string | null
          reviewer_id?: string | null
          self_overall_rating?: number | null
          self_review_submitted_at?: string | null
          status?: Database["public"]["Enums"]["appraisal_status"]
          strengths?: string | null
          template_id?: string | null
          training_recommendations?: string | null
          updated_at?: string
        }
        Update: {
          appraisal_cycle_id?: string
          areas_of_improvement?: string | null
          created_at?: string
          employee_acknowledged_at?: string | null
          employee_acknowledgement?: boolean
          employee_id?: string
          employee_response?: string | null
          final_overall_rating?: number | null
          hr_comments?: string | null
          hr_finalized_at?: string | null
          hr_reviewer_id?: string | null
          id?: string
          increment_percentage_recommended?: number | null
          manager_comments?: string | null
          manager_overall_rating?: number | null
          manager_review_submitted_at?: string | null
          promotion_recommended_designation?: string | null
          recommendation?:
            | Database["public"]["Enums"]["appraisal_recommendation"]
            | null
          reviewer_2_id?: string | null
          reviewer_id?: string | null
          self_overall_rating?: number | null
          self_review_submitted_at?: string | null
          status?: Database["public"]["Enums"]["appraisal_status"]
          strengths?: string | null
          template_id?: string | null
          training_recommendations?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_appraisal_cycle_id_fkey"
            columns: ["appraisal_cycle_id"]
            isOneToOne: false
            referencedRelation: "appraisal_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_hr_reviewer_id_fkey"
            columns: ["hr_reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_reviewer_2_id_fkey"
            columns: ["reviewer_2_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "appraisal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
        }
        Relationships: []
      }
      attendance_sessions: {
        Row: {
          check_in_accuracy_meters: number | null
          check_in_address: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_time: string
          check_out_accuracy_meters: number | null
          check_out_address: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_time: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          employee_id: string
          id: string
          notes: string | null
          session_date: string
          session_type: string
          source: string
          updated_at: string
        }
        Insert: {
          check_in_accuracy_meters?: number | null
          check_in_address?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string
          check_out_accuracy_meters?: number | null
          check_out_address?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          employee_id: string
          id?: string
          notes?: string | null
          session_date?: string
          session_type: string
          source?: string
          updated_at?: string
        }
        Update: {
          check_in_accuracy_meters?: number | null
          check_in_address?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string
          check_out_accuracy_meters?: number | null
          check_out_address?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          employee_id?: string
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      bom: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          product_id: string
          quantity: number
          reference: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id: string
          quantity?: number
          reference: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id?: string
          quantity?: number
          reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_lines: {
        Row: {
          bom_id: string
          component_product_id: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          unit_of_measure: string | null
          updated_at: string
        }
        Insert: {
          bom_id: string
          component_product_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          unit_of_measure?: string | null
          updated_at?: string
        }
        Update: {
          bom_id?: string
          component_product_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          unit_of_measure?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_lines_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_lines_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          muted_until: string | null
          notification_level: string
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
          notification_level?: string
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
          notification_level?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          id: string
          is_archived: boolean
          is_private: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_private?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_private?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_attachments: {
        Row: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          height: number | null
          id: string
          message_id: string
          mime_type: string | null
          thumbnail_url: string | null
          uploaded_at: string
          width: number | null
        }
        Insert: {
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          height?: number | null
          id?: string
          message_id: string
          mime_type?: string | null
          thumbnail_url?: string | null
          uploaded_at?: string
          width?: number | null
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          height?: number | null
          id?: string
          message_id?: string
          mime_type?: string | null
          thumbnail_url?: string | null
          uploaded_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_mentions: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          mentioned_user_id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          mentioned_user_id: string
          message_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          mentioned_user_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          body_tsv: unknown
          channel_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          is_pinned: boolean
          last_thread_reply_at: string | null
          linked_resource_id: string | null
          linked_resource_label: string | null
          linked_resource_type: string | null
          message_type: string
          parent_message_id: string | null
          pinned_at: string | null
          pinned_by: string | null
          thread_reply_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          body_tsv?: unknown
          channel_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          last_thread_reply_at?: string | null
          linked_resource_id?: string | null
          linked_resource_label?: string | null
          linked_resource_type?: string | null
          message_type?: string
          parent_message_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          thread_reply_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          body_tsv?: unknown
          channel_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          last_thread_reply_at?: string | null
          linked_resource_id?: string | null
          linked_resource_label?: string | null
          linked_resource_type?: string | null
          message_type?: string
          parent_message_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          thread_reply_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_notifications: {
        Row: {
          actor_user_id: string | null
          body_preview: string | null
          channel_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          body_preview?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_user_id?: string | null
          body_preview?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_notifications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comp_off_credits: {
        Row: {
          comp_off_days: number
          created_at: string
          employee_id: string
          expiry_date: string
          granted_by: string | null
          id: string
          notes: string | null
          used: boolean
          used_in_leave_request_id: string | null
          work_date: string
        }
        Insert: {
          comp_off_days?: number
          created_at?: string
          employee_id: string
          expiry_date?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          used?: boolean
          used_in_leave_request_id?: string | null
          work_date: string
        }
        Update: {
          comp_off_days?: number
          created_at?: string
          employee_id?: string
          expiry_date?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          used?: boolean
          used_in_leave_request_id?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "comp_off_credits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_off_credits_used_in_leave_request_id_fkey"
            columns: ["used_in_leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          country: string
          email: string | null
          gstin: string | null
          id: string
          letterhead_footer: string | null
          logo_url: string | null
          phone: string | null
          pincode: string | null
          standard_terms: string | null
          state: string | null
          thermal_width_mm: number
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string
          country?: string
          email?: string | null
          gstin?: string | null
          id?: string
          letterhead_footer?: string | null
          logo_url?: string | null
          phone?: string | null
          pincode?: string | null
          standard_terms?: string | null
          state?: string | null
          thermal_width_mm?: number
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          country?: string
          email?: string | null
          gstin?: string | null
          id?: string
          letterhead_footer?: string | null
          logo_url?: string | null
          phone?: string | null
          pincode?: string | null
          standard_terms?: string | null
          state?: string | null
          thermal_width_mm?: number
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          basic_salary: number
          contract_document_url: string | null
          contract_number: string | null
          contract_type: string
          conveyance_allowance: number
          created_at: string
          ctc: number
          currency: string
          da: number
          employee_id: string
          end_date: string | null
          gross_salary: number | null
          hra: number
          id: string
          medical_allowance: number
          notice_period_days: number | null
          other_allowances_json: Json
          probation_period_months: number | null
          signed_date: string | null
          special_allowance: number
          start_date: string
          status: string
          updated_at: string
          working_days_per_week: number
          working_hours_per_day: number
        }
        Insert: {
          basic_salary?: number
          contract_document_url?: string | null
          contract_number?: string | null
          contract_type?: string
          conveyance_allowance?: number
          created_at?: string
          ctc?: number
          currency?: string
          da?: number
          employee_id: string
          end_date?: string | null
          gross_salary?: number | null
          hra?: number
          id?: string
          medical_allowance?: number
          notice_period_days?: number | null
          other_allowances_json?: Json
          probation_period_months?: number | null
          signed_date?: string | null
          special_allowance?: number
          start_date: string
          status?: string
          updated_at?: string
          working_days_per_week?: number
          working_hours_per_day?: number
        }
        Update: {
          basic_salary?: number
          contract_document_url?: string | null
          contract_number?: string | null
          contract_type?: string
          conveyance_allowance?: number
          created_at?: string
          ctc?: number
          currency?: string
          da?: number
          employee_id?: string
          end_date?: string | null
          gross_salary?: number | null
          hra?: number
          id?: string
          medical_allowance?: number
          notice_period_days?: number | null
          other_allowances_json?: Json
          probation_period_months?: number | null
          signed_date?: string | null
          special_allowance?: number
          start_date?: string
          status?: string
          updated_at?: string
          working_days_per_week?: number
          working_hours_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
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
      customers: {
        Row: {
          address: string | null
          company: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          credit_limit: number | null
          default_billing_address: string | null
          default_delivery_address: string | null
          default_payment_terms: string | null
          default_pricelist_id: string | null
          email: string | null
          fiscal_position_id: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          portal_enabled: boolean
          portal_token: string | null
          salesperson_id: string | null
          tags: string[]
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          default_billing_address?: string | null
          default_delivery_address?: string | null
          default_payment_terms?: string | null
          default_pricelist_id?: string | null
          email?: string | null
          fiscal_position_id?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          portal_enabled?: boolean
          portal_token?: string | null
          salesperson_id?: string | null
          tags?: string[]
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          default_billing_address?: string | null
          default_delivery_address?: string | null
          default_payment_terms?: string | null
          default_pricelist_id?: string | null
          email?: string | null
          fiscal_position_id?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          portal_enabled?: boolean
          portal_token?: string | null
          salesperson_id?: string | null
          tags?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_default_pricelist_id_fkey"
            columns: ["default_pricelist_id"]
            isOneToOne: false
            referencedRelation: "pricelists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_fiscal_position_id_fkey"
            columns: ["fiscal_position_id"]
            isOneToOne: false
            referencedRelation: "sales_fiscal_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_delivery_address: string | null
          customer_delivery_name: string | null
          customer_delivery_phone: string | null
          customer_id: string | null
          delivery_date: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          products_json: Json
          qc_by: string | null
          reference: string | null
          sales_order_id: string | null
          signature_collected: boolean
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_delivery_address?: string | null
          customer_delivery_name?: string | null
          customer_delivery_phone?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          products_json?: Json
          qc_by?: string | null
          reference?: string | null
          sales_order_id?: string | null
          signature_collected?: boolean
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_delivery_address?: string | null
          customer_delivery_name?: string | null
          customer_delivery_phone?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          products_json?: Json
          qc_by?: string | null
          reference?: string | null
          sales_order_id?: string | null
          signature_collected?: boolean
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notes_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          parent_department_id: string | null
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          parent_department_id?: string | null
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          parent_department_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advances: {
        Row: {
          advance_amount: number
          created_at: string
          deducted_amount: number
          deduction_month: string
          employee_id: string
          id: string
          notes: string | null
          remaining_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          advance_amount: number
          created_at?: string
          deducted_amount?: number
          deduction_month: string
          employee_id: string
          id?: string
          notes?: string | null
          remaining_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          advance_amount?: number
          created_at?: string
          deducted_amount?: number
          deduction_month?: string
          employee_id?: string
          id?: string
          notes?: string | null
          remaining_amount?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_entitlements: {
        Row: {
          allocated_days: number
          carry_forward_max_days: number | null
          created_at: string
          employee_id: string
          id: string
          leave_type_id: string
          max_consecutive_days: number | null
          min_notice_days: number | null
          notes: string | null
          updated_at: string
          year: number
        }
        Insert: {
          allocated_days?: number
          carry_forward_max_days?: number | null
          created_at?: string
          employee_id: string
          id?: string
          leave_type_id: string
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          notes?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          allocated_days?: number
          carry_forward_max_days?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          leave_type_id?: string
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          notes?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_entitlements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_entitlements_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_loans: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          loan_amount: number
          monthly_emi: number
          notes: string | null
          paid_emis: number
          remaining_amount: number | null
          start_month: string
          status: string
          total_emis: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          loan_amount: number
          monthly_emi: number
          notes?: string | null
          paid_emis?: number
          remaining_amount?: number | null
          start_month: string
          status?: string
          total_emis: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          loan_amount?: number
          monthly_emi?: number
          notes?: string | null
          paid_emis?: number
          remaining_amount?: number | null
          start_month?: string
          status?: string
          total_emis?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rosters: {
        Row: {
          comp_off_reason: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          original_off_date: string | null
          planned_by: string | null
          roster_date: string
          roster_type: string
          updated_at: string
        }
        Insert: {
          comp_off_reason?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          original_off_date?: string | null
          planned_by?: string | null
          roster_date: string
          roster_type?: string
          updated_at?: string
        }
        Update: {
          comp_off_reason?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          original_off_date?: string | null
          planned_by?: string | null
          roster_date?: string
          roster_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_rosters_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          bank_account_number: string | null
          bank_name: string | null
          blood_group: string | null
          created_at: string
          date_of_birth: string | null
          date_of_exit: string | null
          date_of_joining: string | null
          department_id: string | null
          designation: string | null
          display_name: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_code: string | null
          employment_type: string
          esi_number: string | null
          exit_reason: string | null
          full_name: string
          gender: string | null
          id: string
          ifsc_code: string | null
          marital_status: string | null
          notes: string | null
          pan_number: string | null
          personal_phone: string | null
          pf_number: string | null
          phone: string | null
          profile_photo_url: string | null
          reports_to: string | null
          status: string
          uan_number: string | null
          updated_at: string
          user_id: string | null
          work_location: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_exit?: string | null
          date_of_joining?: string | null
          department_id?: string | null
          designation?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code?: string | null
          employment_type?: string
          esi_number?: string | null
          exit_reason?: string | null
          full_name: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          marital_status?: string | null
          notes?: string | null
          pan_number?: string | null
          personal_phone?: string | null
          pf_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          reports_to?: string | null
          status?: string
          uan_number?: string | null
          updated_at?: string
          user_id?: string | null
          work_location?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_exit?: string | null
          date_of_joining?: string | null
          department_id?: string | null
          designation?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code?: string | null
          employment_type?: string
          esi_number?: string | null
          exit_reason?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          marital_status?: string | null
          notes?: string | null
          pan_number?: string | null
          personal_phone?: string | null
          pf_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          reports_to?: string | null
          status?: string
          uan_number?: string | null
          updated_at?: string
          user_id?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          is_optional: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          is_optional?: boolean
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          is_optional?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          location_id: string | null
          location_name: string | null
          notes: string | null
          reason: string
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          reason?: string
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          reason?: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          approval_notes: string | null
          approved_price: number | null
          cgst_amount: number | null
          created_at: string
          description: string | null
          discount: number
          final_amount: number | null
          id: string
          igst_amount: number | null
          invoice_id: string
          product_id: string | null
          quantity: number
          sgst_amount: number | null
          subtotal: number
          tax_rate: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approved_price?: number | null
          cgst_amount?: number | null
          created_at?: string
          description?: string | null
          discount?: number
          final_amount?: number | null
          id?: string
          igst_amount?: number | null
          invoice_id: string
          product_id?: string | null
          quantity?: number
          sgst_amount?: number | null
          subtotal?: number
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approved_price?: number | null
          cgst_amount?: number | null
          created_at?: string
          description?: string | null
          discount?: number
          final_amount?: number | null
          id?: string
          igst_amount?: number | null
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          sgst_amount?: number | null
          subtotal?: number
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          customer_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          paid_amount: number
          price_approval_status: string
          reference: string
          sales_order_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          price_approval_status?: string
          reference: string
          sales_order_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          price_approval_status?: string
          reference?: string
          sales_order_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      label_prints: {
        Row: {
          barcode_value: string
          goods_receipt_id: string | null
          id: string
          label_format: string
          print_count: number
          printed_at: string
          printed_by: string | null
          product_id: string
          serial_number: string
        }
        Insert: {
          barcode_value: string
          goods_receipt_id?: string | null
          id?: string
          label_format?: string
          print_count?: number
          printed_at?: string
          printed_by?: string | null
          product_id: string
          serial_number: string
        }
        Update: {
          barcode_value?: string
          goods_receipt_id?: string | null
          id?: string
          label_format?: string
          print_count?: number
          printed_at?: string
          printed_by?: string | null
          product_id?: string
          serial_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_prints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_approval_log: {
        Row: {
          action: string
          action_date: string
          actor_id: string | null
          comments: string | null
          id: string
          leave_request_id: string
          new_status: string | null
          previous_status: string | null
        }
        Insert: {
          action: string
          action_date?: string
          actor_id?: string | null
          comments?: string | null
          id?: string
          leave_request_id: string
          new_status?: string | null
          previous_status?: string | null
        }
        Update: {
          action?: string
          action_date?: string
          actor_id?: string | null
          comments?: string | null
          id?: string
          leave_request_id?: string
          new_status?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_approval_log_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          accrued: number
          available_balance: number | null
          carried_forward: number
          created_at: string
          employee_id: string
          id: string
          leave_type_id: string
          opening_balance: number
          pending_approval: number
          updated_at: string
          used: number
          year: number
        }
        Insert: {
          accrued?: number
          available_balance?: number | null
          carried_forward?: number
          created_at?: string
          employee_id: string
          id?: string
          leave_type_id: string
          opening_balance?: number
          pending_approval?: number
          updated_at?: string
          used?: number
          year: number
        }
        Update: {
          accrued?: number
          available_balance?: number | null
          carried_forward?: number
          created_at?: string
          employee_id?: string
          id?: string
          leave_type_id?: string
          opening_balance?: number
          pending_approval?: number
          updated_at?: string
          used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          applied_date: string | null
          approved_date: string | null
          approver_id: string | null
          attachment_url: string | null
          contact_during_leave: string | null
          created_at: string
          employee_id: string
          end_date: string
          half_day_session: string | null
          id: string
          is_half_day: boolean
          leave_type_id: string
          notes: string | null
          reason: string | null
          rejection_reason: string | null
          request_number: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          applied_date?: string | null
          approved_date?: string | null
          approver_id?: string | null
          attachment_url?: string | null
          contact_during_leave?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          half_day_session?: string | null
          id?: string
          is_half_day?: boolean
          leave_type_id: string
          notes?: string | null
          reason?: string | null
          rejection_reason?: string | null
          request_number?: string | null
          start_date: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Update: {
          applied_date?: string | null
          approved_date?: string | null
          approver_id?: string | null
          attachment_url?: string | null
          contact_during_leave?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          half_day_session?: string | null
          id?: string
          is_half_day?: boolean
          leave_type_id?: string
          notes?: string | null
          reason?: string | null
          rejection_reason?: string | null
          request_number?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          accrual_type: string
          allow_half_day: boolean
          allow_negative_balance: boolean
          applicable_after_months: number
          code: string
          color: string
          created_at: string
          default_carry_forward_max_days: number
          default_days_per_year: number
          default_max_consecutive_days: number | null
          default_min_notice_days: number
          description: string | null
          gender_restriction: string
          id: string
          is_active: boolean
          is_paid: boolean
          name: string
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          accrual_type?: string
          allow_half_day?: boolean
          allow_negative_balance?: boolean
          applicable_after_months?: number
          code: string
          color?: string
          created_at?: string
          default_carry_forward_max_days?: number
          default_days_per_year?: number
          default_max_consecutive_days?: number | null
          default_min_notice_days?: number
          description?: string | null
          gender_restriction?: string
          id?: string
          is_active?: boolean
          is_paid?: boolean
          name: string
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          accrual_type?: string
          allow_half_day?: boolean
          allow_negative_balance?: boolean
          applicable_after_months?: number
          code?: string
          color?: string
          created_at?: string
          default_carry_forward_max_days?: number
          default_days_per_year?: number
          default_max_consecutive_days?: number | null
          default_min_notice_days?: number
          description?: string | null
          gender_restriction?: string
          id?: string
          is_active?: boolean
          is_paid?: boolean
          name?: string
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      lots: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          manufacturing_date: string | null
          name: string
          notes: string | null
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          manufacturing_date?: string | null
          name: string
          notes?: string | null
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          manufacturing_date?: string | null
          name?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      numbering_sequences: {
        Row: {
          document_type: string
          fy_label: string
          id: string
          last_number: number
          updated_at: string
        }
        Insert: {
          document_type: string
          fy_label: string
          id?: string
          last_number?: number
          updated_at?: string
        }
        Update: {
          document_type?: string
          fy_label?: string
          id?: string
          last_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      numbering_settings: {
        Row: {
          fy_start_day: number
          fy_start_month: number
          id: string
          prefix_separator: string
          sequential_padding: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          fy_start_day?: number
          fy_start_month?: number
          id?: string
          prefix_separator?: string
          sequential_padding?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          fy_start_day?: number
          fy_start_month?: number
          id?: string
          prefix_separator?: string
          sequential_padding?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      order_activities: {
        Row: {
          action: string
          details: string | null
          id: string
          order_id: string
          timestamp: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          details?: string | null
          id?: string
          order_id: string
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          details?: string | null
          id?: string
          order_id?: string
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          barcode: string | null
          cgst_amount: number | null
          created_at: string
          customization: string | null
          delivered_qty: number
          description: string | null
          discount: number
          discount_amount: number | null
          discount_type: string
          discount_value: number | null
          final_amount: number | null
          gst_rate: number | null
          id: string
          igst_amount: number | null
          invoiced_qty: number
          net_amount: number | null
          order_id: string
          per_line_discount_type: string | null
          product_id: string | null
          product_name: string | null
          quantity: number
          reserved_stock: boolean
          sgst_amount: number | null
          subtotal: number
          tax_amount: number
          tax_ids: string[]
          tax_rate: number
          total: number
          unit_price: number
          units: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          cgst_amount?: number | null
          created_at?: string
          customization?: string | null
          delivered_qty?: number
          description?: string | null
          discount?: number
          discount_amount?: number | null
          discount_type?: string
          discount_value?: number | null
          final_amount?: number | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoiced_qty?: number
          net_amount?: number | null
          order_id: string
          per_line_discount_type?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          reserved_stock?: boolean
          sgst_amount?: number | null
          subtotal?: number
          tax_amount?: number
          tax_ids?: string[]
          tax_rate?: number
          total?: number
          unit_price?: number
          units?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          cgst_amount?: number | null
          created_at?: string
          customization?: string | null
          delivered_qty?: number
          description?: string | null
          discount?: number
          discount_amount?: number | null
          discount_type?: string
          discount_value?: number | null
          final_amount?: number | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoiced_qty?: number
          net_amount?: number | null
          order_id?: string
          per_line_discount_type?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          reserved_stock?: boolean
          sgst_amount?: number | null
          subtotal?: number
          tax_amount?: number
          tax_ids?: string[]
          tax_rate?: number
          total?: number
          unit_price?: number
          units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          method: string
          notes: string | null
          payment_date: string
          reference: string | null
          sales_order_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          notes?: string | null
          payment_date?: string
          reference?: string | null
          sales_order_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          notes?: string | null
          payment_date?: string
          reference?: string | null
          sales_order_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          id: string
          locked_at: string | null
          locked_by: string | null
          paid_at: string | null
          payment_reference: string | null
          period_label: string
          period_month: number
          period_year: number
          processed_at: string | null
          processed_by: string | null
          status: string
          total_deductions: number
          total_employees: number
          total_employer_contrib: number
          total_gross: number
          total_net: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          period_label: string
          period_month: number
          period_year: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_deductions?: number
          total_employees?: number
          total_employer_contrib?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          period_label?: string
          period_month?: number
          period_year?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_deductions?: number
          total_employees?: number
          total_employer_contrib?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Relationships: []
      }
      payroll_settings: {
        Row: {
          created_at: string
          esi_gross_threshold: number
          esi_rate_employee: number
          esi_rate_employer: number
          financial_year: string
          id: string
          is_active: boolean
          overtime_rate_multiplier: number
          pf_basic_cap: number
          pf_rate: number
          pt_amount: number
          pt_state: string
          standard_deduction: number
          tds_regime: string
          updated_at: string
          working_days_per_month: number
          working_hours_per_day: number
        }
        Insert: {
          created_at?: string
          esi_gross_threshold?: number
          esi_rate_employee?: number
          esi_rate_employer?: number
          financial_year: string
          id?: string
          is_active?: boolean
          overtime_rate_multiplier?: number
          pf_basic_cap?: number
          pf_rate?: number
          pt_amount?: number
          pt_state?: string
          standard_deduction?: number
          tds_regime?: string
          updated_at?: string
          working_days_per_month?: number
          working_hours_per_day?: number
        }
        Update: {
          created_at?: string
          esi_gross_threshold?: number
          esi_rate_employee?: number
          esi_rate_employer?: number
          financial_year?: string
          id?: string
          is_active?: boolean
          overtime_rate_multiplier?: number
          pf_basic_cap?: number
          pf_rate?: number
          pt_amount?: number
          pt_state?: string
          standard_deduction?: number
          tds_regime?: string
          updated_at?: string
          working_days_per_month?: number
          working_hours_per_day?: number
        }
        Relationships: []
      }
      payslip_components: {
        Row: {
          amount: number
          calculation_notes: string | null
          created_at: string
          id: string
          payslip_id: string
          salary_component_id: string
          sort_order: number
        }
        Insert: {
          amount?: number
          calculation_notes?: string | null
          created_at?: string
          id?: string
          payslip_id: string
          salary_component_id: string
          sort_order?: number
        }
        Update: {
          amount?: number
          calculation_notes?: string | null
          created_at?: string
          id?: string
          payslip_id?: string
          salary_component_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslip_components_payslip_id_fkey"
            columns: ["payslip_id"]
            isOneToOne: false
            referencedRelation: "payslips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslip_components_salary_component_id_fkey"
            columns: ["salary_component_id"]
            isOneToOne: false
            referencedRelation: "salary_components"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          contract_id: string | null
          created_at: string
          ctc_for_period: number
          employee_id: string
          employer_contributions: number
          finalized_at: string | null
          gross_earnings: number
          id: string
          lop_days: number
          net_pay: number
          notes: string | null
          overtime_hours: number
          paid_days: number | null
          payment_date: string | null
          payment_reference: string | null
          payroll_period_id: string
          payslip_number: string
          payslip_pdf_url: string | null
          status: string
          total_deductions: number
          total_working_days: number
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          ctc_for_period?: number
          employee_id: string
          employer_contributions?: number
          finalized_at?: string | null
          gross_earnings?: number
          id?: string
          lop_days?: number
          net_pay?: number
          notes?: string | null
          overtime_hours?: number
          paid_days?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payroll_period_id: string
          payslip_number: string
          payslip_pdf_url?: string | null
          status?: string
          total_deductions?: number
          total_working_days?: number
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          ctc_for_period?: number
          employee_id?: string
          employer_contributions?: number
          finalized_at?: string | null
          gross_earnings?: number
          id?: string
          lop_days?: number
          net_pay?: number
          notes?: string | null
          overtime_hours?: number
          paid_days?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payroll_period_id?: string
          payslip_number?: string
          payslip_pdf_url?: string | null
          status?: string
          total_deductions?: number
          total_working_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      pricelist_items: {
        Row: {
          category_id: string | null
          created_at: string
          discount_percentage: number | null
          end_date: string | null
          id: string
          min_qty: number
          price: number
          pricelist_id: string
          product_id: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          min_qty?: number
          price?: number
          pricelist_id: string
          product_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          min_qty?: number
          price?: number
          pricelist_id?: string
          product_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricelist_items_pricelist_id_fkey"
            columns: ["pricelist_id"]
            isOneToOne: false
            referencedRelation: "pricelists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricelist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricelists: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          currency: string
          end_date: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          parent_pricelist_id: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          parent_pricelist_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          parent_pricelist_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricelists_parent_pricelist_id_fkey"
            columns: ["parent_pricelist_id"]
            isOneToOne: false
            referencedRelation: "pricelists"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          barcodes: string[]
          category: string
          cost_method: string
          cost_price: number
          created_at: string
          default_location_id: string | null
          description: string | null
          factory_eligible: boolean
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          reorder_level: number
          sale_price: number
          sku: string
          stock_on_hand: number
          track_inventory: boolean
          track_lots: boolean
          track_serials: boolean
          type: string
          unit_of_measure: string
          updated_at: string
          variants: Json
          volume: number | null
          warranty_eligible: boolean
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          barcodes?: string[]
          category?: string
          cost_method?: string
          cost_price?: number
          created_at?: string
          default_location_id?: string | null
          description?: string | null
          factory_eligible?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          reorder_level?: number
          sale_price?: number
          sku: string
          stock_on_hand?: number
          track_inventory?: boolean
          track_lots?: boolean
          track_serials?: boolean
          type?: string
          unit_of_measure?: string
          updated_at?: string
          variants?: Json
          volume?: number | null
          warranty_eligible?: boolean
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          barcodes?: string[]
          category?: string
          cost_method?: string
          cost_price?: number
          created_at?: string
          default_location_id?: string | null
          description?: string | null
          factory_eligible?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          reorder_level?: number
          sale_price?: number
          sku?: string
          stock_on_hand?: number
          track_inventory?: boolean
          track_lots?: boolean
          track_serials?: boolean
          type?: string
          unit_of_measure?: string
          updated_at?: string
          variants?: Json
          volume?: number | null
          warranty_eligible?: boolean
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_default_location_fk"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_lines: {
        Row: {
          barcode: string | null
          cgst_amount: number | null
          created_at: string
          customization: string | null
          description: string | null
          discount: number
          discount_amount: number | null
          discount_type: string
          discount_value: number | null
          final_amount: number | null
          gst_rate: number | null
          id: string
          igst_amount: number | null
          net_amount: number | null
          per_line_discount_type: string | null
          product_id: string | null
          product_name: string | null
          quantity: number
          quotation_id: string
          sgst_amount: number | null
          stock_available: number | null
          subtotal: number
          tax_amount: number
          tax_ids: string[]
          tax_rate: number
          total: number
          unit_price: number
          units: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          cgst_amount?: number | null
          created_at?: string
          customization?: string | null
          description?: string | null
          discount?: number
          discount_amount?: number | null
          discount_type?: string
          discount_value?: number | null
          final_amount?: number | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          net_amount?: number | null
          per_line_discount_type?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          quotation_id: string
          sgst_amount?: number | null
          stock_available?: number | null
          subtotal?: number
          tax_amount?: number
          tax_ids?: string[]
          tax_rate?: number
          total?: number
          unit_price?: number
          units?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          cgst_amount?: number | null
          created_at?: string
          customization?: string | null
          description?: string | null
          discount?: number
          discount_amount?: number | null
          discount_type?: string
          discount_value?: number | null
          final_amount?: number | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          net_amount?: number | null
          per_line_discount_type?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          quotation_id?: string
          sgst_amount?: number | null
          stock_available?: number | null
          subtotal?: number
          tax_amount?: number
          tax_ids?: string[]
          tax_rate?: number
          total?: number
          unit_price?: number
          units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_lines_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string | null
          data: Json
          id: string
          quotation_id: string
          version: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          quotation_id: string
          version: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          quotation_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_versions_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          billing_address_line_1: string | null
          billing_address_line_2: string | null
          billing_cargo_elevator: boolean | null
          billing_city: string | null
          billing_customer_name: string | null
          billing_floor_number: number | null
          billing_gstin: string | null
          billing_location_type: string | null
          billing_name: string | null
          billing_office_cargo_elevator: boolean | null
          billing_office_floor_number: number | null
          billing_office_staircase_height: number | null
          billing_office_staircase_width: number | null
          billing_phone_1: string | null
          billing_phone_2: string | null
          billing_road_available_for_tempo: boolean | null
          billing_staircase_height: number | null
          billing_staircase_width: number | null
          billing_state: string | null
          billing_zip: string | null
          contact_id: string | null
          contact_name: string | null
          converted_to_order_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          current_version: number
          customer_id: string | null
          customer_name: string | null
          date: string
          delivery_address_line_1: string | null
          delivery_address_line_2: string | null
          delivery_cargo_elevator: boolean | null
          delivery_city: string | null
          delivery_floor_number: number | null
          delivery_gstin: string | null
          delivery_location_type: string | null
          delivery_name: string | null
          delivery_office_cargo_elevator: boolean | null
          delivery_office_floor_number: number | null
          delivery_office_staircase_height: number | null
          delivery_office_staircase_width: number | null
          delivery_road_available_for_tempo: boolean | null
          delivery_same_as_billing: boolean | null
          delivery_staircase_height: number | null
          delivery_staircase_width: number | null
          delivery_state: string | null
          delivery_zip: string | null
          discount_amount: number
          expiry_date: string | null
          global_discount: number
          global_discount_type: string
          grand_total: number | null
          gst_type: string | null
          id: string
          notes: string | null
          opportunity_id: string | null
          order_discount_amount: number | null
          order_discount_type: string | null
          order_discount_value: number | null
          payment_terms: string | null
          points_earned: number | null
          points_redeemed: number | null
          pricelist_id: string | null
          redemption_amount: number | null
          reference: string
          sales_team: string | null
          salesperson_id: string | null
          salesperson_name: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          terms_and_conditions: string | null
          total: number
          total_cgst: number | null
          total_gst: number | null
          total_igst: number | null
          total_sgst: number | null
          total_untaxed: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_cargo_elevator?: boolean | null
          billing_city?: string | null
          billing_customer_name?: string | null
          billing_floor_number?: number | null
          billing_gstin?: string | null
          billing_location_type?: string | null
          billing_name?: string | null
          billing_office_cargo_elevator?: boolean | null
          billing_office_floor_number?: number | null
          billing_office_staircase_height?: number | null
          billing_office_staircase_width?: number | null
          billing_phone_1?: string | null
          billing_phone_2?: string | null
          billing_road_available_for_tempo?: boolean | null
          billing_staircase_height?: number | null
          billing_staircase_width?: number | null
          billing_state?: string | null
          billing_zip?: string | null
          contact_id?: string | null
          contact_name?: string | null
          converted_to_order_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_version?: number
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_address_line_1?: string | null
          delivery_address_line_2?: string | null
          delivery_cargo_elevator?: boolean | null
          delivery_city?: string | null
          delivery_floor_number?: number | null
          delivery_gstin?: string | null
          delivery_location_type?: string | null
          delivery_name?: string | null
          delivery_office_cargo_elevator?: boolean | null
          delivery_office_floor_number?: number | null
          delivery_office_staircase_height?: number | null
          delivery_office_staircase_width?: number | null
          delivery_road_available_for_tempo?: boolean | null
          delivery_same_as_billing?: boolean | null
          delivery_staircase_height?: number | null
          delivery_staircase_width?: number | null
          delivery_state?: string | null
          delivery_zip?: string | null
          discount_amount?: number
          expiry_date?: string | null
          global_discount?: number
          global_discount_type?: string
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          order_discount_amount?: number | null
          order_discount_type?: string | null
          order_discount_value?: number | null
          payment_terms?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          pricelist_id?: string | null
          redemption_amount?: number | null
          reference: string
          sales_team?: string | null
          salesperson_id?: string | null
          salesperson_name?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms_and_conditions?: string | null
          total?: number
          total_cgst?: number | null
          total_gst?: number | null
          total_igst?: number | null
          total_sgst?: number | null
          total_untaxed?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_cargo_elevator?: boolean | null
          billing_city?: string | null
          billing_customer_name?: string | null
          billing_floor_number?: number | null
          billing_gstin?: string | null
          billing_location_type?: string | null
          billing_name?: string | null
          billing_office_cargo_elevator?: boolean | null
          billing_office_floor_number?: number | null
          billing_office_staircase_height?: number | null
          billing_office_staircase_width?: number | null
          billing_phone_1?: string | null
          billing_phone_2?: string | null
          billing_road_available_for_tempo?: boolean | null
          billing_staircase_height?: number | null
          billing_staircase_width?: number | null
          billing_state?: string | null
          billing_zip?: string | null
          contact_id?: string | null
          contact_name?: string | null
          converted_to_order_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_version?: number
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_address_line_1?: string | null
          delivery_address_line_2?: string | null
          delivery_cargo_elevator?: boolean | null
          delivery_city?: string | null
          delivery_floor_number?: number | null
          delivery_gstin?: string | null
          delivery_location_type?: string | null
          delivery_name?: string | null
          delivery_office_cargo_elevator?: boolean | null
          delivery_office_floor_number?: number | null
          delivery_office_staircase_height?: number | null
          delivery_office_staircase_width?: number | null
          delivery_road_available_for_tempo?: boolean | null
          delivery_same_as_billing?: boolean | null
          delivery_staircase_height?: number | null
          delivery_staircase_width?: number | null
          delivery_state?: string | null
          delivery_zip?: string | null
          discount_amount?: number
          expiry_date?: string | null
          global_discount?: number
          global_discount_type?: string
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          order_discount_amount?: number | null
          order_discount_type?: string | null
          order_discount_value?: number | null
          payment_terms?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          pricelist_id?: string | null
          redemption_amount?: number | null
          reference?: string
          sales_team?: string | null
          salesperson_id?: string | null
          salesperson_name?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms_and_conditions?: string | null
          total?: number
          total_cgst?: number | null
          total_gst?: number | null
          total_igst?: number | null
          total_sgst?: number | null
          total_untaxed?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_pricelist_id_fkey"
            columns: ["pricelist_id"]
            isOneToOne: false
            referencedRelation: "pricelists"
            referencedColumns: ["id"]
          },
        ]
      }
      reorder_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_triggered: string | null
          lead_time_days: number
          location_id: string | null
          max_qty: number
          min_qty: number
          product_id: string
          product_name: string
          reorder_qty: number
          updated_at: string
          warehouse_id: string
          warehouse_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered?: string | null
          lead_time_days?: number
          location_id?: string | null
          max_qty?: number
          min_qty?: number
          product_id: string
          product_name: string
          reorder_qty?: number
          updated_at?: string
          warehouse_id: string
          warehouse_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered?: string | null
          lead_time_days?: number
          location_id?: string | null
          max_qty?: number
          min_qty?: number
          product_id?: string
          product_name?: string
          reorder_qty?: number
          updated_at?: string
          warehouse_id?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reorder_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_rules_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components: {
        Row: {
          affects_lop: boolean
          calculation_type: string
          code: string
          created_at: string
          default_value: number
          display_order: number
          id: string
          is_active: boolean
          is_esi_applicable: boolean
          is_pf_applicable: boolean
          is_taxable: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          affects_lop?: boolean
          calculation_type?: string
          code: string
          created_at?: string
          default_value?: number
          display_order?: number
          id?: string
          is_active?: boolean
          is_esi_applicable?: boolean
          is_pf_applicable?: boolean
          is_taxable?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          affects_lop?: boolean
          calculation_type?: string
          code?: string
          created_at?: string
          default_value?: number
          display_order?: number
          id?: string
          is_active?: boolean
          is_esi_applicable?: boolean
          is_pf_applicable?: boolean
          is_taxable?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_fiscal_positions: {
        Row: {
          client_id: string
          code: string
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          tax_mappings: Json
          updated_at: string
        }
        Insert: {
          client_id: string
          code: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tax_mappings?: Json
          updated_at?: string
        }
        Update: {
          client_id?: string
          code?: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tax_mappings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sales_loyalty_transactions: {
        Row: {
          amount: number
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          points: number
          txn_type: string
        }
        Insert: {
          amount?: number
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          points?: number
          txn_type: string
        }
        Update: {
          amount?: number
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          points?: number
          txn_type?: string
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          billing_address: string | null
          billing_address_line_1: string | null
          billing_address_line_2: string | null
          billing_cargo_elevator: boolean | null
          billing_city: string | null
          billing_customer_name: string | null
          billing_floor_number: number | null
          billing_gstin: string | null
          billing_location_type: string | null
          billing_name: string | null
          billing_office_cargo_elevator: boolean | null
          billing_office_floor_number: number | null
          billing_office_staircase_height: number | null
          billing_office_staircase_width: number | null
          billing_phone_1: string | null
          billing_phone_2: string | null
          billing_road_available_for_tempo: boolean | null
          billing_staircase_height: number | null
          billing_staircase_width: number | null
          billing_state: string | null
          billing_zip: string | null
          commitment_date: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          customer_name: string | null
          delivery_address: string | null
          delivery_address_line_1: string | null
          delivery_address_line_2: string | null
          delivery_cargo_elevator: boolean | null
          delivery_city: string | null
          delivery_date: string | null
          delivery_floor_number: number | null
          delivery_gstin: string | null
          delivery_location_type: string | null
          delivery_name: string | null
          delivery_office_cargo_elevator: boolean | null
          delivery_office_floor_number: number | null
          delivery_office_staircase_height: number | null
          delivery_office_staircase_width: number | null
          delivery_road_available_for_tempo: boolean | null
          delivery_same_as_billing: boolean | null
          delivery_staircase_height: number | null
          delivery_staircase_width: number | null
          delivery_state: string | null
          delivery_status: string | null
          delivery_zip: string | null
          discount_amount: number
          fiscal_position_id: string | null
          grand_total: number | null
          gst_type: string | null
          id: string
          invoice_id: string | null
          invoice_ids: string[] | null
          invoice_status: string | null
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          order_date: string
          order_discount_amount: number | null
          order_discount_type: string | null
          order_discount_value: number | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_terms: string | null
          points_earned: number | null
          points_redeemed: number | null
          pricelist_id: string | null
          quotation_id: string | null
          redemption_amount: number | null
          reference: string
          sales_team: string | null
          salesperson_id: string | null
          salesperson_name: string | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          total_cgst: number | null
          total_gst: number | null
          total_igst: number | null
          total_sgst: number | null
          total_untaxed: number | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_cargo_elevator?: boolean | null
          billing_city?: string | null
          billing_customer_name?: string | null
          billing_floor_number?: number | null
          billing_gstin?: string | null
          billing_location_type?: string | null
          billing_name?: string | null
          billing_office_cargo_elevator?: boolean | null
          billing_office_floor_number?: number | null
          billing_office_staircase_height?: number | null
          billing_office_staircase_width?: number | null
          billing_phone_1?: string | null
          billing_phone_2?: string | null
          billing_road_available_for_tempo?: boolean | null
          billing_staircase_height?: number | null
          billing_staircase_width?: number | null
          billing_state?: string | null
          billing_zip?: string | null
          commitment_date?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          delivery_address_line_1?: string | null
          delivery_address_line_2?: string | null
          delivery_cargo_elevator?: boolean | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_floor_number?: number | null
          delivery_gstin?: string | null
          delivery_location_type?: string | null
          delivery_name?: string | null
          delivery_office_cargo_elevator?: boolean | null
          delivery_office_floor_number?: number | null
          delivery_office_staircase_height?: number | null
          delivery_office_staircase_width?: number | null
          delivery_road_available_for_tempo?: boolean | null
          delivery_same_as_billing?: boolean | null
          delivery_staircase_height?: number | null
          delivery_staircase_width?: number | null
          delivery_state?: string | null
          delivery_status?: string | null
          delivery_zip?: string | null
          discount_amount?: number
          fiscal_position_id?: string | null
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          invoice_id?: string | null
          invoice_ids?: string[] | null
          invoice_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          order_date?: string
          order_discount_amount?: number | null
          order_discount_type?: string | null
          order_discount_value?: number | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_terms?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          pricelist_id?: string | null
          quotation_id?: string | null
          redemption_amount?: number | null
          reference: string
          sales_team?: string | null
          salesperson_id?: string | null
          salesperson_name?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          total_cgst?: number | null
          total_gst?: number | null
          total_igst?: number | null
          total_sgst?: number | null
          total_untaxed?: number | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_cargo_elevator?: boolean | null
          billing_city?: string | null
          billing_customer_name?: string | null
          billing_floor_number?: number | null
          billing_gstin?: string | null
          billing_location_type?: string | null
          billing_name?: string | null
          billing_office_cargo_elevator?: boolean | null
          billing_office_floor_number?: number | null
          billing_office_staircase_height?: number | null
          billing_office_staircase_width?: number | null
          billing_phone_1?: string | null
          billing_phone_2?: string | null
          billing_road_available_for_tempo?: boolean | null
          billing_staircase_height?: number | null
          billing_staircase_width?: number | null
          billing_state?: string | null
          billing_zip?: string | null
          commitment_date?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          delivery_address_line_1?: string | null
          delivery_address_line_2?: string | null
          delivery_cargo_elevator?: boolean | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_floor_number?: number | null
          delivery_gstin?: string | null
          delivery_location_type?: string | null
          delivery_name?: string | null
          delivery_office_cargo_elevator?: boolean | null
          delivery_office_floor_number?: number | null
          delivery_office_staircase_height?: number | null
          delivery_office_staircase_width?: number | null
          delivery_road_available_for_tempo?: boolean | null
          delivery_same_as_billing?: boolean | null
          delivery_staircase_height?: number | null
          delivery_staircase_width?: number | null
          delivery_state?: string | null
          delivery_status?: string | null
          delivery_zip?: string | null
          discount_amount?: number
          fiscal_position_id?: string | null
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          invoice_id?: string | null
          invoice_ids?: string[] | null
          invoice_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          order_date?: string
          order_discount_amount?: number | null
          order_discount_type?: string | null
          order_discount_value?: number | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_terms?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          pricelist_id?: string | null
          quotation_id?: string | null
          redemption_amount?: number | null
          reference?: string
          sales_team?: string | null
          salesperson_id?: string | null
          salesperson_name?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          total_cgst?: number | null
          total_gst?: number | null
          total_igst?: number | null
          total_sgst?: number | null
          total_untaxed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_fiscal_position_id_fkey"
            columns: ["fiscal_position_id"]
            isOneToOne: false
            referencedRelation: "sales_fiscal_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_pricelist_id_fkey"
            columns: ["pricelist_id"]
            isOneToOne: false
            referencedRelation: "pricelists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_seasonal_promotions: {
        Row: {
          active: boolean
          applicable_product_ids: Json
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          applicable_product_ids?: Json
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          applicable_product_ids?: Json
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_reports: {
        Row: {
          columns_json: Json
          created_at: string
          description: string | null
          filters_json: Json
          id: string
          is_shared: boolean
          name: string
          report_key: string
          shared_with_role: string | null
          sort_by: string | null
          sort_dir: string
          updated_at: string
          user_id: string
        }
        Insert: {
          columns_json?: Json
          created_at?: string
          description?: string | null
          filters_json?: Json
          id?: string
          is_shared?: boolean
          name: string
          report_key: string
          shared_with_role?: string | null
          sort_by?: string | null
          sort_dir?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          columns_json?: Json
          created_at?: string
          description?: string | null
          filters_json?: Json
          id?: string
          is_shared?: boolean
          name?: string
          report_key?: string
          shared_with_role?: string | null
          sort_by?: string | null
          sort_dir?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_queue: {
        Row: {
          assigned_to: string | null
          created_at: string
          document_id: string
          document_reference: string
          document_type: string
          expected_items_count: number
          id: string
          notes: string | null
          priority: string
          scan_status: string
          scanned_items_count: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          document_id: string
          document_reference: string
          document_type: string
          expected_items_count?: number
          id?: string
          notes?: string | null
          priority?: string
          scan_status?: string
          scanned_items_count?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          document_id?: string
          document_reference?: string
          document_type?: string
          expected_items_count?: number
          id?: string
          notes?: string | null
          priority?: string
          scan_status?: string
          scanned_items_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      scan_records: {
        Row: {
          barcode: string
          id: string
          notes: string | null
          product_id: string | null
          scan_queue_id: string
          scan_result: string
          scanned_at: string
          scanned_by: string | null
          serial_number: string | null
        }
        Insert: {
          barcode: string
          id?: string
          notes?: string | null
          product_id?: string | null
          scan_queue_id: string
          scan_result?: string
          scanned_at?: string
          scanned_by?: string | null
          serial_number?: string | null
        }
        Update: {
          barcode?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          scan_queue_id?: string
          scan_result?: string
          scanned_at?: string
          scanned_by?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_records_scan_queue_id_fkey"
            columns: ["scan_queue_id"]
            isOneToOne: false
            referencedRelation: "scan_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string
          delivery_email: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string
          saved_report_id: string
          schedule: string
          schedule_date: number | null
          schedule_day: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_email: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string
          saved_report_id: string
          schedule: string
          schedule_date?: number | null
          schedule_day?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_email?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string
          saved_report_id?: string
          schedule?: string
          schedule_date?: number | null
          schedule_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_saved_report_id_fkey"
            columns: ["saved_report_id"]
            isOneToOne: false
            referencedRelation: "saved_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          lot_id: string | null
          name: string
          product_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          lot_id?: string | null
          name: string
          product_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          lot_id?: string | null
          name?: string
          product_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_move_lines: {
        Row: {
          created_at: string
          demand_qty: number
          destination_location_id: string | null
          done_qty: number
          id: string
          lot_id: string | null
          lot_name: string | null
          product_id: string
          product_name: string
          product_sku: string
          reserved_qty: number
          serial_numbers: string[]
          source_location_id: string | null
          stock_move_id: string
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          demand_qty?: number
          destination_location_id?: string | null
          done_qty?: number
          id?: string
          lot_id?: string | null
          lot_name?: string | null
          product_id: string
          product_name: string
          product_sku: string
          reserved_qty?: number
          serial_numbers?: string[]
          source_location_id?: string | null
          stock_move_id: string
          unit_of_measure?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          demand_qty?: number
          destination_location_id?: string | null
          done_qty?: number
          id?: string
          lot_id?: string | null
          lot_name?: string | null
          product_id?: string
          product_name?: string
          product_sku?: string
          reserved_qty?: number
          serial_numbers?: string[]
          source_location_id?: string | null
          stock_move_id?: string
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_move_lines_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_move_lines_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_move_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_move_lines_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_move_lines_stock_move_id_fkey"
            columns: ["stock_move_id"]
            isOneToOne: false
            referencedRelation: "stock_moves"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_moves: {
        Row: {
          back_order_id: string | null
          created_at: string
          created_by: string | null
          destination_location_id: string | null
          destination_location_name: string | null
          effective_date: string | null
          id: string
          notes: string | null
          operation_type: string
          partner_id: string | null
          partner_name: string | null
          reference: string
          scheduled_date: string
          source_document: string | null
          source_location_id: string | null
          source_location_name: string | null
          state: string
          updated_at: string
        }
        Insert: {
          back_order_id?: string | null
          created_at?: string
          created_by?: string | null
          destination_location_id?: string | null
          destination_location_name?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          operation_type: string
          partner_id?: string | null
          partner_name?: string | null
          reference: string
          scheduled_date?: string
          source_document?: string | null
          source_location_id?: string | null
          source_location_name?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          back_order_id?: string | null
          created_at?: string
          created_by?: string | null
          destination_location_id?: string | null
          destination_location_name?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          operation_type?: string
          partner_id?: string | null
          partner_name?: string | null
          reference?: string
          scheduled_date?: string
          source_document?: string | null
          source_location_id?: string | null
          source_location_name?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_back_order_id_fkey"
            columns: ["back_order_id"]
            isOneToOne: false
            referencedRelation: "stock_moves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          created_at: string
          id: string
          lot_id: string | null
          notes: string | null
          order_line_id: string | null
          product_id: string
          quantity: number
          reserved_at: string
          reserved_by: string | null
          sales_order_id: string
          serial_number_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id?: string | null
          notes?: string | null
          order_line_id?: string | null
          product_id: string
          quantity?: number
          reserved_at?: string
          reserved_by?: string | null
          sales_order_id: string
          serial_number_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string | null
          notes?: string | null
          order_line_id?: string | null
          product_id?: string
          quantity?: number
          reserved_at?: string
          reserved_by?: string | null
          sales_order_id?: string
          serial_number_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_lines: {
        Row: {
          created_at: string
          discount: number
          id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          subscription_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number
          id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          subscription_id: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number
          id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          subscription_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_lines_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          billing_period: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          customer_name: string | null
          end_date: string | null
          id: string
          last_order_id: string | null
          next_billing_date: string | null
          order_history: string[]
          payment_terms: string | null
          price: number
          product_id: string | null
          reference: string | null
          start_date: string
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          billing_period?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          customer_name?: string | null
          end_date?: string | null
          id?: string
          last_order_id?: string | null
          next_billing_date?: string | null
          order_history?: string[]
          payment_terms?: string | null
          price?: number
          product_id?: string | null
          reference?: string | null
          start_date?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          billing_period?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          customer_name?: string | null
          end_date?: string | null
          id?: string
          last_order_id?: string | null
          next_billing_date?: string | null
          order_history?: string[]
          payment_terms?: string | null
          price?: number
          product_id?: string | null
          reference?: string | null
          start_date?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      tax_slabs: {
        Row: {
          created_at: string
          financial_year: string
          from_amount: number
          id: string
          rate_percentage: number
          regime: string
          slab_order: number
          to_amount: number | null
        }
        Insert: {
          created_at?: string
          financial_year: string
          from_amount: number
          id?: string
          rate_percentage: number
          regime: string
          slab_order: number
          to_amount?: number | null
        }
        Update: {
          created_at?: string
          financial_year?: string
          from_amount?: number
          id?: string
          rate_percentage?: number
          regime?: string
          slab_order?: number
          to_amount?: number | null
        }
        Relationships: []
      }
      transfer_lines: {
        Row: {
          available: boolean
          created_at: string
          demand_qty: number
          done_qty: number
          id: string
          product_id: string
          product_name: string
          transfer_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          demand_qty?: number
          done_qty?: number
          id?: string
          product_id: string
          product_name: string
          transfer_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          demand_qty?: number
          done_qty?: number
          id?: string
          product_id?: string
          product_name?: string
          transfer_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_lines_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          activities: Json
          back_order_of: string | null
          contact: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          destination_location: string | null
          estimate_date: string | null
          from_warehouse_id: string | null
          id: string
          notes: string[]
          operation_type: string | null
          product_availability: string
          reference: string
          scheduled_date: string
          source_document: string | null
          source_location: string | null
          state: string
          to_warehouse_id: string | null
          updated_at: string
        }
        Insert: {
          activities?: Json
          back_order_of?: string | null
          contact?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          destination_location?: string | null
          estimate_date?: string | null
          from_warehouse_id?: string | null
          id?: string
          notes?: string[]
          operation_type?: string | null
          product_availability?: string
          reference: string
          scheduled_date?: string
          source_document?: string | null
          source_location?: string | null
          state?: string
          to_warehouse_id?: string | null
          updated_at?: string
        }
        Update: {
          activities?: Json
          back_order_of?: string | null
          contact?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          destination_location?: string | null
          estimate_date?: string | null
          from_warehouse_id?: string | null
          id?: string
          notes?: string[]
          operation_type?: string | null
          product_availability?: string
          reference?: string
          scheduled_date?: string
          source_document?: string | null
          source_location?: string | null
          state?: string
          to_warehouse_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_back_order_of_fkey"
            columns: ["back_order_of"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
      warehouse_locations: {
        Row: {
          aisle: string | null
          barcode: string | null
          bin: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_location_id: string | null
          shelf: string | null
          type: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          aisle?: string | null
          barcode?: string | null
          bin?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_location_id?: string | null
          shelf?: string | null
          type?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          aisle?: string | null
          barcode?: string | null
          bin?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_location_id?: string | null
          shelf?: string | null
          type?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          code: string
          created_at: string
          default_delivery_location_id: string | null
          default_internal_location_id: string | null
          default_receipt_location_id: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          default_delivery_location_id?: string | null
          default_internal_location_id?: string | null
          default_receipt_location_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          default_delivery_location_id?: string | null
          default_internal_location_id?: string | null
          default_receipt_location_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_default_delivery_fk"
            columns: ["default_delivery_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_default_internal_fk"
            columns: ["default_internal_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_default_receipt_fk"
            columns: ["default_receipt_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_centers: {
        Row: {
          capacity: number
          code: string
          cost_per_hour: number
          created_at: string
          efficiency_percentage: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          code: string
          cost_per_hour?: number
          created_at?: string
          efficiency_percentage?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          code?: string
          cost_per_hour?: number
          created_at?: string
          efficiency_percentage?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_order_components: {
        Row: {
          consumed_qty: number
          created_at: string
          id: string
          lot_number: string | null
          product_id: string
          required_qty: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          consumed_qty?: number
          created_at?: string
          id?: string
          lot_number?: string | null
          product_id: string
          required_qty?: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          consumed_qty?: number
          created_at?: string
          id?: string
          lot_number?: string | null
          product_id?: string
          required_qty?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_components_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          bom_id: string | null
          created_at: string
          id: string
          notes: string | null
          planned_qty: number
          produced_qty: number
          product_id: string
          reference: string
          scheduled_end: string | null
          scheduled_start: string | null
          state: string
          updated_at: string
          work_center_id: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          bom_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_qty?: number
          produced_qty?: number
          product_id: string
          reference: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          state?: string
          updated_at?: string
          work_center_id?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          bom_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_qty?: number
          produced_qty?: number
          product_id?: string
          reference?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          state?: string
          updated_at?: string
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          break_duration_minutes: number
          created_at: string
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          is_working_day: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          break_duration_minutes?: number
          created_at?: string
          day_of_week: number
          employee_id: string
          end_time?: string
          id?: string
          is_working_day?: boolean
          start_time?: string
          updated_at?: string
        }
        Update: {
          break_duration_minutes?: number
          created_at?: string
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          is_working_day?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      appraisal_user_can_access: {
        Args: { _appraisal_id: string }
        Returns: boolean
      }
      can_write_inventory: { Args: never; Returns: boolean }
      generate_document_number: {
        Args: { p_document_type: string }
        Returns: string
      }
      get_current_employee_id: { Args: never; Returns: string }
      get_current_fy_label: { Args: never; Returns: string }
      get_dashboard_role: { Args: never; Returns: string }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_audit_log: {
        Args: {
          _action: string
          _details?: string
          _ip_address?: string
          _resource: string
          _resource_id?: string
          _user_id: string
          _user_name: string
        }
        Returns: string
      }
      inv_approve_adjustment: {
        Args: { _adjustment_id: string; _approved_by: string }
        Returns: undefined
      }
      inv_validate_stock_move: {
        Args: { _move_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_app_admin: { Args: { _user_id: string }; Returns: boolean }
      is_chat_channel_admin: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_employee_self: { Args: { _employee_id: string }; Returns: boolean }
      is_manager_of: { Args: { target_employee_id: string }; Returns: boolean }
      is_reviewer_for: { Args: { _reviewer_id: string }; Returns: boolean }
      portal_get_quotation: {
        Args: { _id: string; _token: string }
        Returns: Json
      }
      portal_list_quotations: { Args: { _token: string }; Returns: Json }
      portal_list_sales_orders: { Args: { _token: string }; Returns: Json }
      portal_resolve_customer: { Args: { _token: string }; Returns: string }
      portal_update_quotation_status: {
        Args: { _id: string; _status: string; _token: string }
        Returns: Json
      }
      preview_next_document_number: {
        Args: { p_document_type: string }
        Returns: string
      }
    }
    Enums: {
      activity_type:
        | "call"
        | "email"
        | "meeting"
        | "task"
        | "note"
        | "follow_up"
      app_role:
        | "admin"
        | "sales_manager"
        | "sales_rep"
        | "readonly"
        | "warehouse_operator"
        | "super_admin"
        | "accountant"
        | "hr_manager"
      appraisal_criterion_category:
        | "kpi"
        | "competency"
        | "goal"
        | "behavioral"
        | "skill"
      appraisal_cycle_status: "draft" | "active" | "in_progress" | "closed"
      appraisal_cycle_type:
        | "quarterly"
        | "half_yearly"
        | "annual"
        | "probation"
        | "custom"
      appraisal_goal_priority: "low" | "medium" | "high"
      appraisal_goal_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "cancelled"
      appraisal_rating_scale: "1_to_5" | "1_to_10" | "percentage"
      appraisal_recommendation:
        | "promote"
        | "increment"
        | "maintain"
        | "improve"
        | "pip"
      appraisal_status:
        | "not_started"
        | "self_review"
        | "manager_review"
        | "hr_review"
        | "completed"
        | "closed"
      appraisal_template_scope:
        | "all"
        | "department"
        | "designation"
        | "employment_type"
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
      app_role: [
        "admin",
        "sales_manager",
        "sales_rep",
        "readonly",
        "warehouse_operator",
        "super_admin",
        "accountant",
        "hr_manager",
      ],
      appraisal_criterion_category: [
        "kpi",
        "competency",
        "goal",
        "behavioral",
        "skill",
      ],
      appraisal_cycle_status: ["draft", "active", "in_progress", "closed"],
      appraisal_cycle_type: [
        "quarterly",
        "half_yearly",
        "annual",
        "probation",
        "custom",
      ],
      appraisal_goal_priority: ["low", "medium", "high"],
      appraisal_goal_status: [
        "not_started",
        "in_progress",
        "completed",
        "cancelled",
      ],
      appraisal_rating_scale: ["1_to_5", "1_to_10", "percentage"],
      appraisal_recommendation: [
        "promote",
        "increment",
        "maintain",
        "improve",
        "pip",
      ],
      appraisal_status: [
        "not_started",
        "self_review",
        "manager_review",
        "hr_review",
        "completed",
        "closed",
      ],
      appraisal_template_scope: [
        "all",
        "department",
        "designation",
        "employment_type",
      ],
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
