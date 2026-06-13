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
          break_minutes_total: number
          break_overrun_minutes: number
          calculation_completed_at: string | null
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
          early_departure_minutes: number
          employee_id: string
          expected_work_minutes: number | null
          id: string
          late_arrival_minutes: number
          notes: string | null
          overtime_minutes: number
          session_date: string
          session_type: string
          source: string
          updated_at: string
          work_minutes_total: number
        }
        Insert: {
          break_minutes_total?: number
          break_overrun_minutes?: number
          calculation_completed_at?: string | null
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
          early_departure_minutes?: number
          employee_id: string
          expected_work_minutes?: number | null
          id?: string
          late_arrival_minutes?: number
          notes?: string | null
          overtime_minutes?: number
          session_date?: string
          session_type: string
          source?: string
          updated_at?: string
          work_minutes_total?: number
        }
        Update: {
          break_minutes_total?: number
          break_overrun_minutes?: number
          calculation_completed_at?: string | null
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
          early_departure_minutes?: number
          employee_id?: string
          expected_work_minutes?: number | null
          id?: string
          late_arrival_minutes?: number
          notes?: string | null
          overtime_minutes?: number
          session_date?: string
          session_type?: string
          source?: string
          updated_at?: string
          work_minutes_total?: number
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
          default_advance_percent: number | null
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
          default_advance_percent?: number | null
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
          default_advance_percent?: number | null
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
      correction_order_items: {
        Row: {
          correction_order_id: string
          created_at: string
          current_status: string
          goods_receipt_serial_id: string
          id: string
          latest_qc_cycle: number
          latest_qc_status: string
          notes: string | null
          original_qc_images: Json
          original_qc_notes: string | null
          product_id: string
          serial_number: string
          updated_at: string
        }
        Insert: {
          correction_order_id: string
          created_at?: string
          current_status?: string
          goods_receipt_serial_id: string
          id?: string
          latest_qc_cycle?: number
          latest_qc_status?: string
          notes?: string | null
          original_qc_images?: Json
          original_qc_notes?: string | null
          product_id: string
          serial_number: string
          updated_at?: string
        }
        Update: {
          correction_order_id?: string
          created_at?: string
          current_status?: string
          goods_receipt_serial_id?: string
          id?: string
          latest_qc_cycle?: number
          latest_qc_status?: string
          notes?: string | null
          original_qc_images?: Json
          original_qc_notes?: string | null
          product_id?: string
          serial_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_order_items_correction_order_id_fkey"
            columns: ["correction_order_id"]
            isOneToOne: false
            referencedRelation: "correction_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_order_items_goods_receipt_serial_id_fkey"
            columns: ["goods_receipt_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      correction_order_refunds: {
        Row: {
          correction_order_id: string
          correction_order_item_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_by: string | null
          refund_account_id: string | null
          refund_amount: number
          refund_method: string | null
          refund_received_date: string
          refund_reference: string | null
        }
        Insert: {
          correction_order_id: string
          correction_order_item_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          refund_account_id?: string | null
          refund_amount: number
          refund_method?: string | null
          refund_received_date: string
          refund_reference?: string | null
        }
        Update: {
          correction_order_id?: string
          correction_order_item_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          refund_account_id?: string | null
          refund_amount?: number
          refund_method?: string | null
          refund_received_date?: string
          refund_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correction_order_refunds_correction_order_id_fkey"
            columns: ["correction_order_id"]
            isOneToOne: false
            referencedRelation: "correction_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_order_refunds_correction_order_item_id_fkey"
            columns: ["correction_order_item_id"]
            isOneToOne: false
            referencedRelation: "correction_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_order_refunds_refund_account_id_fkey"
            columns: ["refund_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      correction_orders: {
        Row: {
          addressed_to_id: string | null
          addressed_to_name: string | null
          addressed_to_type: string
          closed_at: string | null
          closed_by: string | null
          co_number: string
          correction_type: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          sent_at: string | null
          source_document_id: string | null
          source_document_reference: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          addressed_to_id?: string | null
          addressed_to_name?: string | null
          addressed_to_type: string
          closed_at?: string | null
          closed_by?: string | null
          co_number: string
          correction_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          source_document_id?: string | null
          source_document_reference?: string | null
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressed_to_id?: string | null
          addressed_to_name?: string | null
          addressed_to_type?: string
          closed_at?: string | null
          closed_by?: string | null
          co_number?: string
          correction_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          source_document_id?: string | null
          source_document_reference?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      correction_qc_cycles: {
        Row: {
          correction_order_item_id: string
          created_at: string
          cycle_number: number
          id: string
          qc_checked_at: string
          qc_checked_by: string
          qc_images: Json
          qc_notes: string | null
          qc_status: string
        }
        Insert: {
          correction_order_item_id: string
          created_at?: string
          cycle_number: number
          id?: string
          qc_checked_at?: string
          qc_checked_by: string
          qc_images?: Json
          qc_notes?: string | null
          qc_status: string
        }
        Update: {
          correction_order_item_id?: string
          created_at?: string
          cycle_number?: number
          id?: string
          qc_checked_at?: string
          qc_checked_by?: string
          qc_images?: Json
          qc_notes?: string | null
          qc_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_qc_cycles_correction_order_item_id_fkey"
            columns: ["correction_order_item_id"]
            isOneToOne: false
            referencedRelation: "correction_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_note_redemptions: {
        Row: {
          amount_applied: number
          applied_at: string
          applied_by: string
          applied_to_invoice_id: string | null
          applied_to_sales_order_id: string | null
          credit_note_id: string
          id: string
        }
        Insert: {
          amount_applied: number
          applied_at?: string
          applied_by: string
          applied_to_invoice_id?: string | null
          applied_to_sales_order_id?: string | null
          credit_note_id: string
          id?: string
        }
        Update: {
          amount_applied?: number
          applied_at?: string
          applied_by?: string
          applied_to_invoice_id?: string | null
          applied_to_sales_order_id?: string | null
          credit_note_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_note_redemptions_applied_to_invoice_id_fkey"
            columns: ["applied_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_redemptions_applied_to_sales_order_id_fkey"
            columns: ["applied_to_sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_redemptions_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "credit_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          amount_remaining: number
          amount_used: number
          cn_number: string
          created_at: string
          created_by: string
          customer_id: string | null
          customer_name_snapshot: string | null
          expiry_date: string
          id: string
          issue_date: string
          notes: string | null
          source_invoice_id: string
          source_return_request_id: string
          status: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          amount_remaining?: number
          amount_used?: number
          cn_number: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          expiry_date: string
          id?: string
          issue_date?: string
          notes?: string | null
          source_invoice_id: string
          source_return_request_id: string
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          amount_remaining?: number
          amount_used?: number
          cn_number?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          source_invoice_id?: string
          source_return_request_id?: string
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_source_return_request_id_fkey"
            columns: ["source_return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
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
      delivery_note_lines: {
        Row: {
          created_at: string
          delivery_note_id: string
          id: string
          invoice_line_id: string | null
          product_id: string | null
          product_name: string | null
          quantity_from_invoice_line: number
          serial_numbers: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_note_id: string
          id?: string
          invoice_line_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity_from_invoice_line?: number
          serial_numbers?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_note_id?: string
          id?: string
          invoice_line_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity_from_invoice_line?: number
          serial_numbers?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_note_lines_delivery_note_id_fkey"
            columns: ["delivery_note_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_note_lines_invoice_line_id_fkey"
            columns: ["invoice_line_id"]
            isOneToOne: false
            referencedRelation: "invoice_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_note_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          customer_signature_date: string | null
          customer_signature_received: boolean
          delivered_at: string | null
          delivered_by_user_id: string | null
          delivery_date: string | null
          dispatched_at: string | null
          dn_sequence_in_invoice: number
          id: string
          invoice_id: string | null
          is_partial: boolean
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
          customer_signature_date?: string | null
          customer_signature_received?: boolean
          delivered_at?: string | null
          delivered_by_user_id?: string | null
          delivery_date?: string | null
          dispatched_at?: string | null
          dn_sequence_in_invoice?: number
          id?: string
          invoice_id?: string | null
          is_partial?: boolean
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
          customer_signature_date?: string | null
          customer_signature_received?: boolean
          delivered_at?: string | null
          delivered_by_user_id?: string | null
          delivery_date?: string | null
          dispatched_at?: string | null
          dn_sequence_in_invoice?: number
          id?: string
          invoice_id?: string | null
          is_partial?: boolean
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
      employee_monthly_leave_allotments: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          month: number
          notes: string | null
          paid_leaves_allotted: number
          paid_leaves_used: number
          unpaid_leaves_used: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          month: number
          notes?: string | null
          paid_leaves_allotted?: number
          paid_leaves_used?: number
          unpaid_leaves_used?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          month?: number
          notes?: string | null
          paid_leaves_allotted?: number
          paid_leaves_used?: number
          unpaid_leaves_used?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_monthly_leave_allotments_employee_id_fkey"
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
          compensatory_off_for_date: string | null
          created_at: string
          employee_id: string
          id: string
          is_sunday_duty: boolean
          is_working_day: boolean
          notes: string | null
          original_off_date: string | null
          planned_by: string | null
          roster_date: string
          roster_type: string
          updated_at: string
        }
        Insert: {
          comp_off_reason?: string | null
          compensatory_off_for_date?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_sunday_duty?: boolean
          is_working_day?: boolean
          notes?: string | null
          original_off_date?: string | null
          planned_by?: string | null
          roster_date: string
          roster_type?: string
          updated_at?: string
        }
        Update: {
          comp_off_reason?: string | null
          compensatory_off_for_date?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_sunday_duty?: boolean
          is_working_day?: boolean
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
      employee_work_schedules: {
        Row: {
          break_minutes_allotted: number
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          employee_id: string
          id: string
          late_threshold_minutes: number
          notes: string | null
          total_work_hours: number
          updated_at: string
          work_end_time: string
          work_start_time: string
          working_days: Json
        }
        Insert: {
          break_minutes_allotted?: number
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          employee_id: string
          id?: string
          late_threshold_minutes?: number
          notes?: string | null
          total_work_hours?: number
          updated_at?: string
          work_end_time?: string
          work_start_time?: string
          working_days?: Json
        }
        Update: {
          break_minutes_allotted?: number
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          employee_id?: string
          id?: string
          late_threshold_minutes?: number
          notes?: string | null
          total_work_hours?: number
          updated_at?: string
          work_end_time?: string
          work_start_time?: string
          working_days?: Json
        }
        Relationships: [
          {
            foreignKeyName: "employee_work_schedules_employee_id_fkey"
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
          is_manager: boolean
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
          is_manager?: boolean
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
          is_manager?: boolean
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
      exchanges: {
        Row: {
          created_at: string
          customer_id: string | null
          exchange_number: string
          id: string
          notes: string | null
          original_serial_id: string
          original_unit_price: number
          payment_received_id: string | null
          price_difference: number
          price_difference_settled: boolean
          processed_by: string
          replacement_product_id: string
          replacement_serial_id: string | null
          replacement_unit_price: number
          return_request_item_id: string
          source_invoice_id: string
          source_return_request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          exchange_number: string
          id?: string
          notes?: string | null
          original_serial_id: string
          original_unit_price: number
          payment_received_id?: string | null
          price_difference?: number
          price_difference_settled?: boolean
          processed_by: string
          replacement_product_id: string
          replacement_serial_id?: string | null
          replacement_unit_price: number
          return_request_item_id: string
          source_invoice_id: string
          source_return_request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          exchange_number?: string
          id?: string
          notes?: string | null
          original_serial_id?: string
          original_unit_price?: number
          payment_received_id?: string | null
          price_difference?: number
          price_difference_settled?: boolean
          processed_by?: string
          replacement_product_id?: string
          replacement_serial_id?: string | null
          replacement_unit_price?: number
          return_request_item_id?: string
          source_invoice_id?: string
          source_return_request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_original_serial_id_fkey"
            columns: ["original_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_payment_received_id_fkey"
            columns: ["payment_received_id"]
            isOneToOne: false
            referencedRelation: "sales_order_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_replacement_product_id_fkey"
            columns: ["replacement_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_replacement_serial_id_fkey"
            columns: ["replacement_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_return_request_item_id_fkey"
            columns: ["return_request_item_id"]
            isOneToOne: false
            referencedRelation: "return_request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_source_return_request_id_fkey"
            columns: ["source_return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_inventory_items: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_level: number
          name: string
          unit_of_measurement: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number
          name: string
          unit_of_measurement: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number
          name?: string
          unit_of_measurement?: string
          updated_at?: string
        }
        Relationships: []
      }
      factory_stock_movements: {
        Row: {
          factory_inventory_item_id: string
          id: string
          movement_type: string
          notes: string | null
          quantity: number
          recorded_at: string
          recorded_by: string | null
          related_work_order_id: string | null
        }
        Insert: {
          factory_inventory_item_id: string
          id?: string
          movement_type: string
          notes?: string | null
          quantity: number
          recorded_at?: string
          recorded_by?: string | null
          related_work_order_id?: string | null
        }
        Update: {
          factory_inventory_item_id?: string
          id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          recorded_at?: string
          recorded_by?: string | null
          related_work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_stock_movements_factory_inventory_item_id_fkey"
            columns: ["factory_inventory_item_id"]
            isOneToOne: false
            referencedRelation: "factory_inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_stock_movements_related_work_order_id_fkey"
            columns: ["related_work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_lines: {
        Row: {
          accepted_quantity: number
          created_at: string
          expected_quantity: number
          goods_receipt_id: string
          id: string
          notes: string | null
          product_id: string
          product_name_cached: string | null
          product_sku_cached: string | null
          received_quantity: number
          rejected_quantity: number
          source_line_id: string | null
          under_correction_quantity: number
          updated_at: string
        }
        Insert: {
          accepted_quantity?: number
          created_at?: string
          expected_quantity?: number
          goods_receipt_id: string
          id?: string
          notes?: string | null
          product_id: string
          product_name_cached?: string | null
          product_sku_cached?: string | null
          received_quantity?: number
          rejected_quantity?: number
          source_line_id?: string | null
          under_correction_quantity?: number
          updated_at?: string
        }
        Update: {
          accepted_quantity?: number
          created_at?: string
          expected_quantity?: number
          goods_receipt_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          product_name_cached?: string | null
          product_sku_cached?: string | null
          received_quantity?: number
          rejected_quantity?: number
          source_line_id?: string | null
          under_correction_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_lines_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_serials: {
        Row: {
          barcode_value: string
          created_at: string
          current_location: string | null
          current_warehouse_id: string | null
          goods_receipt_id: string
          goods_receipt_line_id: string
          id: string
          product_id: string
          qc_checked_at: string | null
          qc_checked_by: string | null
          qc_images: Json
          qc_notes: string | null
          qc_status: string
          reserved_for_so_id: string | null
          serial_number: string
          stock_status: string
          updated_at: string
        }
        Insert: {
          barcode_value: string
          created_at?: string
          current_location?: string | null
          current_warehouse_id?: string | null
          goods_receipt_id: string
          goods_receipt_line_id: string
          id?: string
          product_id: string
          qc_checked_at?: string | null
          qc_checked_by?: string | null
          qc_images?: Json
          qc_notes?: string | null
          qc_status?: string
          reserved_for_so_id?: string | null
          serial_number: string
          stock_status?: string
          updated_at?: string
        }
        Update: {
          barcode_value?: string
          created_at?: string
          current_location?: string | null
          current_warehouse_id?: string | null
          goods_receipt_id?: string
          goods_receipt_line_id?: string
          id?: string
          product_id?: string
          qc_checked_at?: string | null
          qc_checked_by?: string | null
          qc_images?: Json
          qc_notes?: string | null
          qc_status?: string
          reserved_for_so_id?: string | null
          serial_number?: string
          stock_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_serials_current_warehouse_id_fkey"
            columns: ["current_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_serials_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_serials_goods_receipt_line_id_fkey"
            columns: ["goods_receipt_line_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_serials_reserved_for_so_id_fkey"
            columns: ["reserved_for_so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          created_at: string
          created_by: string | null
          discrepancy_approved_at: string | null
          discrepancy_approved_by: string | null
          discrepancy_reason: string | null
          discrepancy_status: string
          gr_number: string | null
          id: string
          labels_generated: boolean
          labels_generated_at: string | null
          notes: string | null
          received_at: string | null
          received_by: string | null
          source_document_id: string | null
          source_document_reference: string | null
          source_type: string
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discrepancy_approved_at?: string | null
          discrepancy_approved_by?: string | null
          discrepancy_reason?: string | null
          discrepancy_status?: string
          gr_number?: string | null
          id?: string
          labels_generated?: boolean
          labels_generated_at?: string | null
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          source_document_id?: string | null
          source_document_reference?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discrepancy_approved_at?: string | null
          discrepancy_approved_by?: string | null
          discrepancy_reason?: string | null
          discrepancy_status?: string
          gr_number?: string | null
          id?: string
          labels_generated?: boolean
          labels_generated_at?: string | null
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          source_document_id?: string | null
          source_document_reference?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          holiday_date: string
          id: string
          is_active: boolean
          is_optional: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          holiday_date: string
          id?: string
          is_active?: boolean
          is_optional?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          holiday_date?: string
          id?: string
          is_active?: boolean
          is_optional?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_movement_items: {
        Row: {
          created_at: string
          goods_receipt_serial_id: string
          id: string
          internal_movement_id: string
          notes: string | null
          product_id: string
          scanned_at_destination: boolean
          scanned_at_source: boolean
          serial_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          goods_receipt_serial_id: string
          id?: string
          internal_movement_id: string
          notes?: string | null
          product_id: string
          scanned_at_destination?: boolean
          scanned_at_source?: boolean
          serial_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goods_receipt_serial_id?: string
          id?: string
          internal_movement_id?: string
          notes?: string | null
          product_id?: string
          scanned_at_destination?: boolean
          scanned_at_source?: boolean
          serial_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_movement_items_goods_receipt_serial_id_fkey"
            columns: ["goods_receipt_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_movement_items_internal_movement_id_fkey"
            columns: ["internal_movement_id"]
            isOneToOne: false
            referencedRelation: "internal_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_movements: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          from_location_id: string | null
          from_location_type: string | null
          id: string
          movement_number: string
          movement_type: string
          notes: string | null
          reason: string | null
          status: string
          to_location_id: string | null
          to_location_type: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          from_location_id?: string | null
          from_location_type?: string | null
          id?: string
          movement_number: string
          movement_type: string
          notes?: string | null
          reason?: string | null
          status?: string
          to_location_id?: string | null
          to_location_type?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          from_location_id?: string | null
          from_location_type?: string | null
          id?: string
          movement_number?: string
          movement_type?: string
          notes?: string | null
          reason?: string | null
          status?: string
          to_location_id?: string | null
          to_location_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      internal_transfer_order_lines: {
        Row: {
          created_at: string
          id: string
          internal_transfer_order_id: string
          line_status: string
          notes: string | null
          product_id: string
          product_source: string
          quantity_expected: number
          quantity_scanned: number
          sales_order_line_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal_transfer_order_id: string
          line_status?: string
          notes?: string | null
          product_id: string
          product_source: string
          quantity_expected: number
          quantity_scanned?: number
          sales_order_line_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          internal_transfer_order_id?: string
          line_status?: string
          notes?: string | null
          product_id?: string
          product_source?: string
          quantity_expected?: number
          quantity_scanned?: number
          sales_order_line_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_transfer_order_lines_internal_transfer_order_id_fkey"
            columns: ["internal_transfer_order_id"]
            isOneToOne: false
            referencedRelation: "internal_transfer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_transfer_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_transfer_order_lines_sales_order_line_id_fkey"
            columns: ["sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_transfer_orders: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          ito_number: string
          notes: string | null
          sales_order_id: string
          status: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ito_number: string
          notes?: string | null
          sales_order_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ito_number?: string
          notes?: string | null
          sales_order_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_transfer_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
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
          quantity_delivered: number
          quantity_from_so_line: number | null
          quantity_remaining_to_deliver: number | null
          sales_order_line_id: string | null
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
          quantity_delivered?: number
          quantity_from_so_line?: number | null
          quantity_remaining_to_deliver?: number | null
          sales_order_line_id?: string | null
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
          quantity_delivered?: number
          quantity_from_so_line?: number | null
          quantity_remaining_to_deliver?: number | null
          sales_order_line_id?: string | null
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
          {
            foreignKeyName: "invoice_lines_sales_order_line_id_fkey"
            columns: ["sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
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
          invoice_sequence_in_so: number
          invoice_type_override_by: string | null
          invoice_type_override_reason: string | null
          is_partial: boolean
          issue_date: string
          notes: string | null
          paid_amount: number
          payment_account_id: string | null
          price_approval_status: string
          reference: string
          sales_order_id: string | null
          status: string
          subtotal: number
          superseded_by_credit_note_id: string | null
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
          invoice_sequence_in_so?: number
          invoice_type_override_by?: string | null
          invoice_type_override_reason?: string | null
          is_partial?: boolean
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          payment_account_id?: string | null
          price_approval_status?: string
          reference: string
          sales_order_id?: string | null
          status?: string
          subtotal?: number
          superseded_by_credit_note_id?: string | null
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
          invoice_sequence_in_so?: number
          invoice_type_override_by?: string | null
          invoice_type_override_reason?: string | null
          is_partial?: boolean
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          payment_account_id?: string | null
          price_approval_status?: string
          reference?: string
          sales_order_id?: string | null
          status?: string
          subtotal?: number
          superseded_by_credit_note_id?: string | null
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
            foreignKeyName: "invoices_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
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
          leave_type_code: string | null
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
          leave_type_code?: string | null
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
          leave_type_code?: string | null
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
          customization_colour: string | null
          customization_fabric: string | null
          customization_notes: string | null
          customization_polish: string | null
          customization_reference_images: Json | null
          customization_size: string | null
          delivered_qty: number
          description: string | null
          discount: number
          discount_amount: number | null
          discount_type: string
          discount_value: number | null
          factory_work_order_id: string | null
          final_amount: number | null
          gst_rate: number | null
          id: string
          igst_amount: number | null
          invoiced_qty: number
          line_eta: string | null
          net_amount: number | null
          order_id: string
          per_line_discount_type: string | null
          product_id: string | null
          product_name: string | null
          product_source: string | null
          quantity: number
          quantity_invoiced: number
          quantity_remaining_to_invoice: number | null
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
          vendor_id: string | null
        }
        Insert: {
          barcode?: string | null
          cgst_amount?: number | null
          created_at?: string
          customization?: string | null
          customization_colour?: string | null
          customization_fabric?: string | null
          customization_notes?: string | null
          customization_polish?: string | null
          customization_reference_images?: Json | null
          customization_size?: string | null
          delivered_qty?: number
          description?: string | null
          discount?: number
          discount_amount?: number | null
          discount_type?: string
          discount_value?: number | null
          factory_work_order_id?: string | null
          final_amount?: number | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoiced_qty?: number
          line_eta?: string | null
          net_amount?: number | null
          order_id: string
          per_line_discount_type?: string | null
          product_id?: string | null
          product_name?: string | null
          product_source?: string | null
          quantity?: number
          quantity_invoiced?: number
          quantity_remaining_to_invoice?: number | null
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
          vendor_id?: string | null
        }
        Update: {
          barcode?: string | null
          cgst_amount?: number | null
          created_at?: string
          customization?: string | null
          customization_colour?: string | null
          customization_fabric?: string | null
          customization_notes?: string | null
          customization_polish?: string | null
          customization_reference_images?: Json | null
          customization_size?: string | null
          delivered_qty?: number
          description?: string | null
          discount?: number
          discount_amount?: number | null
          discount_type?: string
          discount_value?: number | null
          factory_work_order_id?: string | null
          final_amount?: number | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoiced_qty?: number
          line_eta?: string | null
          net_amount?: number | null
          order_id?: string
          per_line_discount_type?: string | null
          product_id?: string | null
          product_name?: string | null
          product_source?: string | null
          quantity?: number
          quantity_invoiced?: number
          quantity_remaining_to_invoice?: number | null
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
          vendor_id?: string | null
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
      payment_accounts: {
        Row: {
          account_name: string
          account_number_last4: string | null
          account_type: string
          bank_name: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number_last4?: string | null
          account_type: string
          bank_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number_last4?: string | null
          account_type?: string
          bank_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
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
      product_customization_options: {
        Row: {
          additional_price: number
          created_at: string
          id: string
          is_active: boolean
          option_type: string
          option_value: string
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          additional_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          option_type: string
          option_value: string
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          additional_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          option_type?: string
          option_value?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_customization_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      refunds: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          customer_name_snapshot: string | null
          id: string
          notes: string | null
          payment_account_id: string
          processed_by: string
          reference_number: string | null
          refund_date: string
          refund_mode: string
          refund_number: string
          source_invoice_id: string
          source_return_request_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          id?: string
          notes?: string | null
          payment_account_id: string
          processed_by: string
          reference_number?: string | null
          refund_date?: string
          refund_mode: string
          refund_number: string
          source_invoice_id: string
          source_return_request_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          id?: string
          notes?: string | null
          payment_account_id?: string
          processed_by?: string
          reference_number?: string | null
          refund_date?: string
          refund_mode?: string
          refund_number?: string
          source_invoice_id?: string
          source_return_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_source_return_request_id_fkey"
            columns: ["source_return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
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
      return_request_items: {
        Row: {
          condition_grade: string | null
          created_at: string
          customization_details: Json | null
          delivery_note_id: string | null
          delivery_note_line_id: string | null
          goods_receipt_serial_id: string
          id: string
          invoice_line_id: string
          is_customized: boolean
          original_unit_price: number
          product_id: string
          qc_checked_at: string | null
          qc_checked_by: string | null
          qc_images: Json
          qc_notes: string | null
          qc_status: string
          quantity: number
          resolution_status: string
          resolution_type: string | null
          return_request_id: string
          serial_number: string
          updated_at: string
        }
        Insert: {
          condition_grade?: string | null
          created_at?: string
          customization_details?: Json | null
          delivery_note_id?: string | null
          delivery_note_line_id?: string | null
          goods_receipt_serial_id: string
          id?: string
          invoice_line_id: string
          is_customized?: boolean
          original_unit_price?: number
          product_id: string
          qc_checked_at?: string | null
          qc_checked_by?: string | null
          qc_images?: Json
          qc_notes?: string | null
          qc_status?: string
          quantity?: number
          resolution_status?: string
          resolution_type?: string | null
          return_request_id: string
          serial_number: string
          updated_at?: string
        }
        Update: {
          condition_grade?: string | null
          created_at?: string
          customization_details?: Json | null
          delivery_note_id?: string | null
          delivery_note_line_id?: string | null
          goods_receipt_serial_id?: string
          id?: string
          invoice_line_id?: string
          is_customized?: boolean
          original_unit_price?: number
          product_id?: string
          qc_checked_at?: string | null
          qc_checked_by?: string | null
          qc_images?: Json
          qc_notes?: string | null
          qc_status?: string
          quantity?: number
          resolution_status?: string
          resolution_type?: string | null
          return_request_id?: string
          serial_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_request_items_delivery_note_id_fkey"
            columns: ["delivery_note_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_delivery_note_line_id_fkey"
            columns: ["delivery_note_line_id"]
            isOneToOne: false
            referencedRelation: "delivery_note_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_goods_receipt_serial_id_fkey"
            columns: ["goods_receipt_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_invoice_line_id_fkey"
            columns: ["invoice_line_id"]
            isOneToOne: false
            referencedRelation: "invoice_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_id: string | null
          customer_name_snapshot: string | null
          customer_photos: Json
          customer_reported_issue_description: string | null
          customer_reported_reason: string
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_status: string
          requested_at: string
          requested_by: string
          rt_number: string
          source_invoice_id: string
          source_sales_order_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          customer_photos?: Json
          customer_reported_issue_description?: string | null
          customer_reported_reason: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_status?: string
          requested_at?: string
          requested_by: string
          rt_number: string
          source_invoice_id: string
          source_sales_order_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          customer_photos?: Json
          customer_reported_issue_description?: string | null
          customer_reported_reason?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_status?: string
          requested_at?: string
          requested_by?: string
          rt_number?: string
          source_invoice_id?: string
          source_sales_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_source_sales_order_id_fkey"
            columns: ["source_sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
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
      sales_order_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_voided: boolean
          notes: string | null
          payment_account_id: string | null
          payment_date: string
          payment_mode: string
          payment_number: string
          received_by: string
          reference_number: string | null
          sales_order_id: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_voided?: boolean
          notes?: string | null
          payment_account_id?: string | null
          payment_date?: string
          payment_mode: string
          payment_number: string
          received_by: string
          reference_number?: string | null
          sales_order_id: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_voided?: boolean
          notes?: string | null
          payment_account_id?: string | null
          payment_date?: string
          payment_mode?: string
          payment_number?: string
          received_by?: string
          reference_number?: string | null
          sales_order_id?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_payments_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_payments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          advance_override_at: string | null
          advance_override_by: string | null
          advance_override_reason: string | null
          advance_percent_received: number | null
          advance_percent_required: number | null
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
          customer_signature_date: string | null
          customer_signature_received: boolean | null
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
          eta_overall: string | null
          fiscal_position_id: string | null
          grand_total: number | null
          gst_type: string | null
          id: string
          invoice_id: string | null
          invoice_ids: string[] | null
          invoice_status: string | null
          locked_at: string | null
          locked_by: string | null
          no_quote_flag: boolean | null
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
          terms_and_conditions: string | null
          total: number
          total_cgst: number | null
          total_gst: number | null
          total_igst: number | null
          total_sgst: number | null
          total_untaxed: number | null
          updated_at: string
        }
        Insert: {
          advance_override_at?: string | null
          advance_override_by?: string | null
          advance_override_reason?: string | null
          advance_percent_received?: number | null
          advance_percent_required?: number | null
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
          customer_signature_date?: string | null
          customer_signature_received?: boolean | null
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
          eta_overall?: string | null
          fiscal_position_id?: string | null
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          invoice_id?: string | null
          invoice_ids?: string[] | null
          invoice_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          no_quote_flag?: boolean | null
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
          terms_and_conditions?: string | null
          total?: number
          total_cgst?: number | null
          total_gst?: number | null
          total_igst?: number | null
          total_sgst?: number | null
          total_untaxed?: number | null
          updated_at?: string
        }
        Update: {
          advance_override_at?: string | null
          advance_override_by?: string | null
          advance_override_reason?: string | null
          advance_percent_received?: number | null
          advance_percent_required?: number | null
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
          customer_signature_date?: string | null
          customer_signature_received?: boolean | null
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
          eta_overall?: string | null
          fiscal_position_id?: string | null
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          invoice_id?: string | null
          invoice_ids?: string[] | null
          invoice_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          no_quote_flag?: boolean | null
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
          terms_and_conditions?: string | null
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
      stock_count_items: {
        Row: {
          count_status: string
          created_at: string
          discrepancy_notes: string | null
          expected_location_type: string | null
          expected_warehouse_id: string | null
          found_location_type: string | null
          found_warehouse_id: string | null
          goods_receipt_serial_id: string
          id: string
          product_id: string
          scanned_at: string | null
          scanned_by: string | null
          serial_number: string
          stock_count_id: string
          updated_at: string
        }
        Insert: {
          count_status?: string
          created_at?: string
          discrepancy_notes?: string | null
          expected_location_type?: string | null
          expected_warehouse_id?: string | null
          found_location_type?: string | null
          found_warehouse_id?: string | null
          goods_receipt_serial_id: string
          id?: string
          product_id: string
          scanned_at?: string | null
          scanned_by?: string | null
          serial_number: string
          stock_count_id: string
          updated_at?: string
        }
        Update: {
          count_status?: string
          created_at?: string
          discrepancy_notes?: string | null
          expected_location_type?: string | null
          expected_warehouse_id?: string | null
          found_location_type?: string | null
          found_warehouse_id?: string | null
          goods_receipt_serial_id?: string
          id?: string
          product_id?: string
          scanned_at?: string | null
          scanned_by?: string | null
          serial_number?: string
          stock_count_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_goods_receipt_serial_id_fkey"
            columns: ["goods_receipt_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_stock_count_id_fkey"
            columns: ["stock_count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          count_number: string
          count_period_month: number
          count_period_year: number
          count_type: string
          created_at: string
          id: string
          notes: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          skip_approved_at: string | null
          skip_approved_by: string | null
          skip_reason: string | null
          started_at: string | null
          started_by: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          count_number: string
          count_period_month: number
          count_period_year: number
          count_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          skip_approved_at?: string | null
          skip_approved_by?: string | null
          skip_reason?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          count_number?: string
          count_period_month?: number
          count_period_year?: number
          count_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          skip_approved_at?: string | null
          skip_approved_by?: string | null
          skip_reason?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
      vendor_order_lines: {
        Row: {
          colour_polish_spec: string | null
          created_at: string
          customization_notes: string | null
          fabric_spec: string | null
          id: string
          product_id: string
          quantity_ordered: number
          quantity_received: number
          reference_images: Json
          size_spec: string | null
          updated_at: string
          vendor_order_id: string
        }
        Insert: {
          colour_polish_spec?: string | null
          created_at?: string
          customization_notes?: string | null
          fabric_spec?: string | null
          id?: string
          product_id: string
          quantity_ordered: number
          quantity_received?: number
          reference_images?: Json
          size_spec?: string | null
          updated_at?: string
          vendor_order_id: string
        }
        Update: {
          colour_polish_spec?: string | null
          created_at?: string
          customization_notes?: string | null
          fabric_spec?: string | null
          id?: string
          product_id?: string
          quantity_ordered?: number
          quantity_received?: number
          reference_images?: Json
          size_spec?: string | null
          updated_at?: string
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_order_lines_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          eta_date: string
          id: string
          linked_sales_order_id: string | null
          linked_sales_order_line_id: string | null
          notes: string | null
          order_mode: string
          placed_at: string | null
          received_at: string | null
          status: string
          updated_at: string
          vendor_id: string
          vo_number: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          eta_date: string
          id?: string
          linked_sales_order_id?: string | null
          linked_sales_order_line_id?: string | null
          notes?: string | null
          order_mode: string
          placed_at?: string | null
          received_at?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          vo_number: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          eta_date?: string
          id?: string
          linked_sales_order_id?: string | null
          linked_sales_order_line_id?: string | null
          notes?: string | null
          order_mode?: string
          placed_at?: string | null
          received_at?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          vo_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_linked_sales_order_id_fkey"
            columns: ["linked_sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_linked_sales_order_line_id_fkey"
            columns: ["linked_sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
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
      wo_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          type: string
          user_id: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          type: string
          user_id: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          type?: string
          user_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wo_notifications_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
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
      work_order_bom_entries: {
        Row: {
          created_at: string
          factory_inventory_item_id: string
          id: string
          notes: string | null
          quantity_consumed: number
          quantity_required: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          factory_inventory_item_id: string
          id?: string
          notes?: string | null
          quantity_consumed?: number
          quantity_required: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          factory_inventory_item_id?: string
          id?: string
          notes?: string | null
          quantity_consumed?: number
          quantity_required?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_bom_entries_factory_inventory_item_id_fkey"
            columns: ["factory_inventory_item_id"]
            isOneToOne: false
            referencedRelation: "factory_inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_bom_entries_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
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
          approval_required: boolean
          approved_at: string | null
          approved_by: string | null
          assigned_factory_incharge_id: string | null
          bom_entered_at: string | null
          bom_id: string | null
          cancellation_reason: string | null
          colour_polish_spec: string | null
          created_at: string
          created_by: string | null
          current_stage: string
          customization_notes: string | null
          eta_date: string | null
          fabric_spec: string | null
          factory_completion_at: string | null
          id: string
          linked_goods_receipt_id: string | null
          linked_sales_order_id: string | null
          linked_sales_order_line_id: string | null
          materials_consumed_at: string | null
          notes: string | null
          placed_at: string | null
          planned_qty: number
          produced_qty: number
          product_id: string
          progress_photos: Json
          quantity: number
          received_at_store_at: string | null
          reference: string | null
          reference_images: Json
          rejection_reason: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          size_spec: string | null
          state: string
          updated_at: string
          wo_number: string | null
          work_center_id: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assigned_factory_incharge_id?: string | null
          bom_entered_at?: string | null
          bom_id?: string | null
          cancellation_reason?: string | null
          colour_polish_spec?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string
          customization_notes?: string | null
          eta_date?: string | null
          fabric_spec?: string | null
          factory_completion_at?: string | null
          id?: string
          linked_goods_receipt_id?: string | null
          linked_sales_order_id?: string | null
          linked_sales_order_line_id?: string | null
          materials_consumed_at?: string | null
          notes?: string | null
          placed_at?: string | null
          planned_qty?: number
          produced_qty?: number
          product_id: string
          progress_photos?: Json
          quantity?: number
          received_at_store_at?: string | null
          reference?: string | null
          reference_images?: Json
          rejection_reason?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          size_spec?: string | null
          state?: string
          updated_at?: string
          wo_number?: string | null
          work_center_id?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assigned_factory_incharge_id?: string | null
          bom_entered_at?: string | null
          bom_id?: string | null
          cancellation_reason?: string | null
          colour_polish_spec?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string
          customization_notes?: string | null
          eta_date?: string | null
          fabric_spec?: string | null
          factory_completion_at?: string | null
          id?: string
          linked_goods_receipt_id?: string | null
          linked_sales_order_id?: string | null
          linked_sales_order_line_id?: string | null
          materials_consumed_at?: string | null
          notes?: string | null
          placed_at?: string | null
          planned_qty?: number
          produced_qty?: number
          product_id?: string
          progress_photos?: Json
          quantity?: number
          received_at_store_at?: string | null
          reference?: string | null
          reference_images?: Json
          rejection_reason?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          size_spec?: string | null
          state?: string
          updated_at?: string
          wo_number?: string | null
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
            foreignKeyName: "work_orders_linked_sales_order_id_fkey"
            columns: ["linked_sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_linked_sales_order_line_id_fkey"
            columns: ["linked_sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
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
      write_off_items: {
        Row: {
          created_at: string
          goods_receipt_serial_id: string
          id: string
          item_specific_notes: string | null
          product_id: string
          serial_number: string
          unit_cost_value: number
          write_off_record_id: string
        }
        Insert: {
          created_at?: string
          goods_receipt_serial_id: string
          id?: string
          item_specific_notes?: string | null
          product_id: string
          serial_number: string
          unit_cost_value?: number
          write_off_record_id: string
        }
        Update: {
          created_at?: string
          goods_receipt_serial_id?: string
          id?: string
          item_specific_notes?: string | null
          product_id?: string
          serial_number?: string
          unit_cost_value?: number
          write_off_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "write_off_items_goods_receipt_serial_id_fkey"
            columns: ["goods_receipt_serial_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "write_off_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "write_off_items_write_off_record_id_fkey"
            columns: ["write_off_record_id"]
            isOneToOne: false
            referencedRelation: "write_off_records"
            referencedColumns: ["id"]
          },
        ]
      }
      write_off_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          evidence_photos: Json
          id: string
          reason: string
          source_document_id: string | null
          source_document_reference: string | null
          source_type: string | null
          status: string
          total_value: number
          updated_at: string
          wf_number: string
          write_off_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by: string
          evidence_photos?: Json
          id?: string
          reason?: string
          source_document_id?: string | null
          source_document_reference?: string | null
          source_type?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          wf_number: string
          write_off_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string
          evidence_photos?: Json
          id?: string
          reason?: string
          source_document_id?: string | null
          source_document_reference?: string | null
          source_type?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          wf_number?: string
          write_off_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_stock_summary: {
        Row: {
          product_id: string | null
          stock_status: string | null
          total_value: number | null
          unit_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_stock_action: { Args: { p_item_id: string }; Returns: Json }
      appraisal_user_can_access: {
        Args: { _appraisal_id: string }
        Returns: boolean
      }
      approve_count_skip: {
        Args: { p_month: number; p_reason: string; p_year: number }
        Returns: string
      }
      approve_return_request: { Args: { p_rt_id: string }; Returns: undefined }
      approve_vendor_order: { Args: { p_vo_id: string }; Returns: undefined }
      approve_work_order: { Args: { p_wo_id: string }; Returns: Json }
      approve_write_off: { Args: { p_wf_id: string }; Returns: Json }
      assign_sunday_duty: {
        Args: {
          p_comp_off_date: string
          p_employee_id: string
          p_sunday_date: string
        }
        Returns: Json
      }
      auto_create_correction_order: {
        Args: { p_gr_id: string }
        Returns: string
      }
      bulk_set_monthly_allotments: {
        Args: { p_employee_allotments: Json; p_month: number; p_year: number }
        Returns: number
      }
      calculate_attendance_metrics: {
        Args: { p_date: string; p_employee_id: string }
        Returns: Json
      }
      calculate_so_advance_percent: {
        Args: { p_so_id: string }
        Returns: number
      }
      can_write_inventory: { Args: never; Returns: boolean }
      cancel_vendor_order: {
        Args: { p_reason: string; p_vo_id: string }
        Returns: undefined
      }
      cancel_work_order: {
        Args: { p_reason: string; p_wo_id: string }
        Returns: Json
      }
      cancel_write_off: {
        Args: { p_reason: string; p_wf_id: string }
        Returns: Json
      }
      check_advance_gate: { Args: { p_so_id: string }; Returns: boolean }
      check_so_closure_ready: { Args: { p_so_id: string }; Returns: boolean }
      check_so_ready_to_invoice: { Args: { p_so_id: string }; Returns: boolean }
      close_correction_order: { Args: { p_co_id: string }; Returns: Json }
      complete_correction_qc_cycle: {
        Args: {
          p_co_item_id: string
          p_images: Json
          p_notes: string
          p_passed: boolean
        }
        Returns: undefined
      }
      complete_factory_work: { Args: { p_wo_id: string }; Returns: undefined }
      complete_gr_line_qc: {
        Args: {
          p_failed_notes: string
          p_failed_serial_ids: string[]
          p_gr_line_id: string
          p_passed_serial_ids: string[]
        }
        Returns: undefined
      }
      complete_internal_movement: {
        Args: { p_movement_id: string }
        Returns: boolean
      }
      complete_return_request: { Args: { p_rt_id: string }; Returns: Json }
      complete_stock_count: { Args: { p_count_id: string }; Returns: Json }
      confirm_delivery: {
        Args: { p_dn_id: string; p_signature_received?: boolean }
        Returns: Json
      }
      create_ito_from_so: {
        Args: { p_confirmed_by: string; p_so_id: string }
        Returns: string
      }
      create_partial_delivery_note: {
        Args: { p_invoice_id: string; p_line_items: Json }
        Returns: string
      }
      create_partial_invoice: {
        Args: {
          p_invoice_type: string
          p_line_quantities: Json
          p_override_reason?: string
          p_payment_account_id: string
          p_so_id: string
        }
        Returns: string
      }
      create_return_request: {
        Args: {
          p_invoice_id: string
          p_issue_description: string
          p_items: Json
          p_reason: string
        }
        Returns: string
      }
      enter_bom: {
        Args: { p_entries: Json; p_wo_id: string }
        Returns: undefined
      }
      expire_credit_notes: { Args: never; Returns: number }
      generate_document_number: {
        Args: { p_document_type: string }
        Returns: string
      }
      generate_serials_for_gr_line: {
        Args: { p_gr_line_id: string }
        Returns: string[]
      }
      get_current_employee_id: { Args: never; Returns: string }
      get_current_fy_label: { Args: never; Returns: string }
      get_dashboard_role: { Args: never; Returns: string }
      get_employee_leave_balance: {
        Args: { p_employee_id: string; p_month: number; p_year: number }
        Returns: Json
      }
      get_employee_schedule_for_date: {
        Args: { p_date: string; p_employee_id: string }
        Returns: {
          break_minutes_allotted: number
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          employee_id: string
          id: string
          late_threshold_minutes: number
          notes: string | null
          total_work_hours: number
          updated_at: string
          work_end_time: string
          work_start_time: string
          working_days: Json
        }
        SetofOptions: {
          from: "*"
          to: "employee_work_schedules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_invoice_delivery_summary: {
        Args: { p_invoice_id: string }
        Returns: Json
      }
      get_product_stock_breakdown: {
        Args: { p_product_id: string }
        Returns: Json
      }
      get_sales_order_payment_summary: {
        Args: { p_so_id: string }
        Returns: Json
      }
      get_so_invoice_summary: { Args: { p_so_id: string }; Returns: Json }
      get_unified_calendar: {
        Args: {
          p_employee_id?: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
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
      initialize_stock_count: { Args: { p_count_id: string }; Returns: number }
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
      is_admin_or_hr: { Args: never; Returns: boolean }
      is_app_admin: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_or_admin: { Args: { p_wo_id: string }; Returns: boolean }
      is_chat_channel_admin: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_count_required_this_month: {
        Args: { p_month: number; p_year: number }
        Returns: boolean
      }
      is_employee_self: { Args: { _employee_id: string }; Returns: boolean }
      is_manager_of: { Args: { target_employee_id: string }; Returns: boolean }
      is_reviewer_for: { Args: { _reviewer_id: string }; Returns: boolean }
      place_vendor_order: { Args: { p_vo_id: string }; Returns: undefined }
      place_work_order: { Args: { p_wo_id: string }; Returns: Json }
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
      process_credit_note_resolution: {
        Args: { p_item_id: string; p_notes: string }
        Returns: string
      }
      process_exchange_resolution: {
        Args: { p_item_id: string; p_replacement_product_id: string }
        Returns: string
      }
      process_refund_resolution: {
        Args: {
          p_amount: number
          p_item_id: string
          p_mode: string
          p_payment_account_id: string
          p_reference: string
        }
        Returns: string
      }
      reconcile_stock_count: {
        Args: { p_count_id: string; p_item_reconciliations: Json }
        Returns: Json
      }
      record_return_qc: {
        Args: {
          p_condition_grade: string
          p_images: Json
          p_item_id: string
          p_notes: string
        }
        Returns: undefined
      }
      redeem_credit_note: {
        Args: {
          p_amount_to_apply: number
          p_cn_id: string
          p_invoice_id: string
          p_sales_order_id: string
        }
        Returns: string
      }
      reject_return_request: {
        Args: { p_reason: string; p_rt_id: string }
        Returns: undefined
      }
      reject_work_order: {
        Args: { p_reason: string; p_wo_id: string }
        Returns: Json
      }
      start_polishing: { Args: { p_wo_id: string }; Returns: undefined }
      start_work: { Args: { p_wo_id: string }; Returns: undefined }
      suggest_ito_for_so: { Args: { p_so_id: string }; Returns: Json }
      validate_invoice_type_against_so: {
        Args: { p_invoice_type: string; p_so_id: string }
        Returns: Json
      }
      validate_return_eligibility: {
        Args: { p_serial_id: string }
        Returns: Json
      }
      validate_so_linked_eta: {
        Args: { p_proposed_eta: string; p_so_id: string }
        Returns: Json
      }
      void_credit_note: {
        Args: { p_cn_id: string; p_reason: string }
        Returns: undefined
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
        | "factory_incharge"
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
        "factory_incharge",
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
