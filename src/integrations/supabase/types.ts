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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_agent_config: {
        Row: {
          history_limit: number
          id: string
          max_message_chars: number
          max_tool_iterations: number
          model: string
          provider: string
          rate_limit_per_10min: number
          reasoning_effort: string
          singleton: boolean
          system_prompt: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          history_limit?: number
          id?: string
          max_message_chars?: number
          max_tool_iterations?: number
          model?: string
          provider?: string
          rate_limit_per_10min?: number
          reasoning_effort?: string
          singleton?: boolean
          system_prompt: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          history_limit?: number
          id?: string
          max_message_chars?: number
          max_tool_iterations?: number
          model?: string
          provider?: string
          rate_limit_per_10min?: number
          reasoning_effort?: string
          singleton?: boolean
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_agent_config_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          changed_fields: string[]
          entity: string
          entity_key: string | null
          id: string
          payload: Json
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changed_fields?: string[]
          entity: string
          entity_key?: string | null
          id?: string
          payload: Json
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changed_fields?: string[]
          entity?: string
          entity_key?: string | null
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      ai_agent_key_status: {
        Row: {
          id: string
          key_prefix: string | null
          last_test_message: string | null
          last_test_status: string | null
          last_tested_at: string | null
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key_prefix?: string | null
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key_prefix?: string | null
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_agent_tools: {
        Row: {
          category: string
          description: string
          display_order: number
          enabled: boolean
          handler_name: string
          name: string
          parameters_schema: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          description: string
          display_order?: number
          enabled?: boolean
          handler_name: string
          name: string
          parameters_schema?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          description?: string
          display_order?: number
          enabled?: boolean
          handler_name?: string
          name?: string
          parameters_schema?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          organization_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          organization_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          organization_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          source: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          source: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          source?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_message_feedback: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          rating: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          rating: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_message_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          status: string
          tool_call_id: string | null
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          status?: string
          tool_call_id?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          status?: string
          tool_call_id?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          cached_tokens: number | null
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          error_type: string | null
          id: string
          input_tokens: number | null
          message_id: string | null
          model: string
          organization_id: string
          output_tokens: number | null
          provider: string
          request_id: string
          status: string
          user_id: string
        }
        Insert: {
          cached_tokens?: number | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          input_tokens?: number | null
          message_id?: string | null
          model: string
          organization_id: string
          output_tokens?: number | null
          provider: string
          request_id: string
          status?: string
          user_id: string
        }
        Update: {
          cached_tokens?: number | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          input_tokens?: number | null
          message_id?: string | null
          model?: string
          organization_id?: string
          output_tokens?: number | null
          provider?: string
          request_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tool_calls: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          params_sanitized: Json | null
          request_id: string
          rows_returned: number | null
          run_id: string | null
          status: string
          tool_name: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          params_sanitized?: Json | null
          request_id: string
          rows_returned?: number | null
          run_id?: string | null
          status?: string
          tool_name: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          params_sanitized?: Json | null
          request_id?: string
          rows_returned?: number | null
          run_id?: string | null
          status?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tool_calls_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          error_message: string | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string | null
          organization_name: string | null
          success: boolean
          target_email: string | null
          target_role: string | null
          user_agent: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          organization_name?: string | null
          success?: boolean
          target_email?: string | null
          target_role?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          organization_name?: string | null
          success?: boolean
          target_email?: string | null
          target_role?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      catalog_leads: {
        Row: {
          catalog_slug: string
          created_at: string
          id: string
          organization_id: string
          pdv_id: string | null
          phone: string
          product_name: string
        }
        Insert: {
          catalog_slug: string
          created_at?: string
          id?: string
          organization_id: string
          pdv_id?: string | null
          phone: string
          product_name: string
        }
        Update: {
          catalog_slug?: string
          created_at?: string
          id?: string
          organization_id?: string
          pdv_id?: string | null
          phone?: string
          product_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_leads_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_short_links: {
        Row: {
          click_count: number
          created_at: string
          id: string
          pdv_id: string
          short_code: string
          target_url: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          pdv_id: string
          short_code: string
          target_url: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          pdv_id?: string
          short_code?: string
          target_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_short_links_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_config: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          pdv_id: string | null
          stone_rate: number
          tax_rate: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          pdv_id?: string | null
          stone_rate?: number
          tax_rate?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          pdv_id?: string | null
          stone_rate?: number
          tax_rate?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dre_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dre_config_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string
          description: string
          id: string
          organization_id: string
          pdv_id: string | null
          reference_month: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          organization_id: string
          pdv_id?: string | null
          reference_month: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          organization_id?: string
          pdv_id?: string | null
          reference_month?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      link_click_events: {
        Row: {
          clicked_at: string
          id: string
          ip_hash: string | null
          referrer: string | null
          short_link_id: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          short_link_id: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          short_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_click_events_short_link_id_fkey"
            columns: ["short_link_id"]
            isOneToOne: false
            referencedRelation: "catalog_short_links"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          organization_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          organization_id: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          organization_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          active_since: string | null
          address: string | null
          catalog_code: string | null
          catalog_code_enabled: boolean | null
          catalog_modal_text: string | null
          catalog_pdv_id: string | null
          catalog_qrcode_url: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          owner_id: string | null
          phone: string | null
          plan: string | null
          public_catalog_enabled: boolean | null
          public_slug: string | null
        }
        Insert: {
          active_since?: string | null
          address?: string | null
          catalog_code?: string | null
          catalog_code_enabled?: boolean | null
          catalog_modal_text?: string | null
          catalog_pdv_id?: string | null
          catalog_qrcode_url?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
          plan?: string | null
          public_catalog_enabled?: boolean | null
          public_slug?: string | null
        }
        Update: {
          active_since?: string | null
          address?: string | null
          catalog_code?: string | null
          catalog_code_enabled?: boolean | null
          catalog_modal_text?: string | null
          catalog_pdv_id?: string | null
          catalog_qrcode_url?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          plan?: string | null
          public_catalog_enabled?: boolean | null
          public_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_catalog_pdv_id_fkey"
            columns: ["catalog_pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempt_count: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          attempt_count?: number
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          attempt_count?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      pdv_catalog_settings: {
        Row: {
          catalog_code: string | null
          catalog_modal_text: string | null
          catalog_qrcode_url: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          is_public_enabled: boolean | null
          pdv_id: string
          public_slug: string | null
          updated_at: string | null
        }
        Insert: {
          catalog_code?: string | null
          catalog_modal_text?: string | null
          catalog_qrcode_url?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_public_enabled?: boolean | null
          pdv_id: string
          public_slug?: string | null
          updated_at?: string | null
        }
        Update: {
          catalog_code?: string | null
          catalog_modal_text?: string | null
          catalog_qrcode_url?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_public_enabled?: boolean | null
          pdv_id?: string
          public_slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdv_catalog_settings_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: true
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_marketing_media: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          media_type: string
          pdv_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          media_type: string
          pdv_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          media_type?: string
          pdv_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdv_marketing_media_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      pdvs: {
        Row: {
          created_at: string | null
          id: string
          location: string
          machine_id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["pdv_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          machine_id: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["pdv_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          machine_id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["pdv_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdvs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_allocations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          pdv_id: string
          pre_stock_id: string | null
          product_name: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          suggested_quantity: number
          upload_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          pdv_id: string
          pre_stock_id?: string | null
          product_name: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suggested_quantity: number
          upload_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          pdv_id?: string
          pre_stock_id?: string | null
          product_name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suggested_quantity?: number
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_allocations_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_stock: {
        Row: {
          allocated_pdv_id: string | null
          created_at: string
          created_by: string
          id: string
          notes: string | null
          organization_id: string
          pdv_id: string | null
          product_name: string
          quantity: number
          remaining_quantity: number
          status: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          allocated_pdv_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          organization_id: string
          pdv_id?: string | null
          product_name: string
          quantity: number
          remaining_quantity: number
          status?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          allocated_pdv_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          organization_id?: string
          pdv_id?: string | null
          product_name?: string
          quantity?: number
          remaining_quantity?: number
          status?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_stock_allocated_pdv_id_fkey"
            columns: ["allocated_pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_stock_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          created_at: string | null
          default_pdv: string | null
          default_period: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          sidebar_collapsed: boolean | null
          sidebar_marketing_expanded: boolean | null
          sidebar_reports_expanded: boolean | null
          sidebar_stock_expanded: boolean | null
          stock_alerts: boolean | null
          theme: string | null
          updated_at: string | null
          upload_notifications: boolean | null
          user_id: string
          weekly_reports: boolean | null
        }
        Insert: {
          created_at?: string | null
          default_pdv?: string | null
          default_period?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          sidebar_collapsed?: boolean | null
          sidebar_marketing_expanded?: boolean | null
          sidebar_reports_expanded?: boolean | null
          sidebar_stock_expanded?: boolean | null
          stock_alerts?: boolean | null
          theme?: string | null
          updated_at?: string | null
          upload_notifications?: boolean | null
          user_id: string
          weekly_reports?: boolean | null
        }
        Update: {
          created_at?: string | null
          default_pdv?: string | null
          default_period?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          sidebar_collapsed?: boolean | null
          sidebar_marketing_expanded?: boolean | null
          sidebar_reports_expanded?: boolean | null
          sidebar_stock_expanded?: boolean | null
          stock_alerts?: boolean | null
          theme?: string | null
          updated_at?: string | null
          upload_notifications?: boolean | null
          user_id?: string
          weekly_reports?: boolean | null
        }
        Relationships: []
      }
      product_requests: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          organization_id: string
          requested_model: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          organization_id: string
          requested_model: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          organization_id?: string
          requested_model?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          id: string
          min_stock: number | null
          name: string
          organization_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          min_stock?: number | null
          name: string
          organization_id: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          min_stock?: number | null
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          organization_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          organization_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_records: {
        Row: {
          actual_paid_amount: number | null
          amount: number
          device_id: string
          discount_amount: number | null
          id: string
          merchant_id: string | null
          order_completion_time: string | null
          order_number: string
          order_time: string | null
          payment_date: string | null
          payment_flow: string | null
          payment_method: string | null
          pdv_id: string
          print_code: string | null
          product_name: string
          refund_amount: number | null
          source: string
          status: string | null
          transaction_number: string | null
          upload_id: string | null
        }
        Insert: {
          actual_paid_amount?: number | null
          amount: number
          device_id: string
          discount_amount?: number | null
          id?: string
          merchant_id?: string | null
          order_completion_time?: string | null
          order_number: string
          order_time?: string | null
          payment_date?: string | null
          payment_flow?: string | null
          payment_method?: string | null
          pdv_id: string
          print_code?: string | null
          product_name: string
          refund_amount?: number | null
          source?: string
          status?: string | null
          transaction_number?: string | null
          upload_id?: string | null
        }
        Update: {
          actual_paid_amount?: number | null
          amount?: number
          device_id?: string
          discount_amount?: number | null
          id?: string
          merchant_id?: string | null
          order_completion_time?: string | null
          order_number?: string
          order_time?: string | null
          payment_date?: string | null
          payment_flow?: string | null
          payment_method?: string | null
          pdv_id?: string
          print_code?: string | null
          product_name?: string
          refund_amount?: number | null
          source?: string
          status?: string | null
          transaction_number?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_history: {
        Row: {
          active_slots: number
          brand: string
          created_at: string | null
          id: string
          organization_id: string
          pdv_id: string
          snapshot_date: string
          total_quantity: number
          upload_id: string | null
        }
        Insert: {
          active_slots?: number
          brand: string
          created_at?: string | null
          id?: string
          organization_id: string
          pdv_id: string
          snapshot_date?: string
          total_quantity?: number
          upload_id?: string | null
        }
        Update: {
          active_slots?: number
          brand?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          pdv_id?: string
          snapshot_date?: string
          total_quantity?: number
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_records: {
        Row: {
          device_id: string
          id: string
          is_active: boolean | null
          pdv_id: string
          product_name: string
          quantity: number
          record_number: string | null
          slot_number: string
          upload_id: string | null
        }
        Insert: {
          device_id: string
          id?: string
          is_active?: boolean | null
          pdv_id: string
          product_name: string
          quantity: number
          record_number?: string | null
          slot_number: string
          upload_id?: string | null
        }
        Update: {
          device_id?: string
          id?: string
          is_active?: boolean | null
          pdv_id?: string
          product_name?: string
          quantity?: number
          record_number?: string | null
          slot_number?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_records_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_anomalies: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_number: string
          product_name: string
          reason: string
          upload_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_number: string
          product_name: string
          reason: string
          upload_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_number?: string
          product_name?: string
          reason?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_anomalies_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          anomaly_count: number | null
          drive_url: string | null
          error_message: string | null
          file_name: string
          file_url: string | null
          id: string
          pdv_id: string
          period: string | null
          processed_at: string | null
          records_count: number | null
          status: Database["public"]["Enums"]["upload_status"] | null
          type: Database["public"]["Enums"]["upload_type"]
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          anomaly_count?: number | null
          drive_url?: string | null
          error_message?: string | null
          file_name: string
          file_url?: string | null
          id?: string
          pdv_id: string
          period?: string | null
          processed_at?: string | null
          records_count?: number | null
          status?: Database["public"]["Enums"]["upload_status"] | null
          type: Database["public"]["Enums"]["upload_type"]
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          anomaly_count?: number | null
          drive_url?: string | null
          error_message?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          pdv_id?: string
          period?: string | null
          processed_at?: string | null
          records_count?: number | null
          status?: Database["public"]["Enums"]["upload_status"] | null
          type?: Database["public"]["Enums"]["upload_type"]
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_org_access: {
        Row: {
          access_level: string
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pdvs: {
        Row: {
          created_at: string | null
          id: string
          pdv_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pdv_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pdv_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pdvs_pdv_id_fkey"
            columns: ["pdv_id"]
            isOneToOne: false
            referencedRelation: "pdvs"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_analyze_restock_targets: {
        Args: {
          _min_coverage_days?: number
          _product_names: string[]
          _target_coverage_days?: number
        }
        Returns: {
          cobertura_destino_dias: number
          compras_pendentes: number
          decisao: string
          excedente_origem: number
          justificativa: string
          melhor_origem: string
          pdv_destino: string
          product_name: string
          qtd_transferivel: number
          stock_destino: number
          stock_origem: number
          vendas_30d_destino: number
        }[]
      }
      ai_get_financial_entries: {
        Args: {
          _limit?: number
          _pdv_ids?: string[]
          _reference_month?: string
        }
        Returns: {
          categoria: string
          descricoes: string
          mes_referencia: string
          num_lancamentos: number
          pdv_nome: string
          total: number
        }[]
      }
      ai_get_financial_summary: {
        Args: { _end: string; _start: string }
        Returns: {
          deducoes: number
          despesas: number
          faturamento: number
          resultado: number
        }[]
      }
      ai_get_financial_summary_by_pdv: {
        Args: { _end: string; _start: string }
        Returns: {
          deducoes: number
          despesas: number
          faturamento: number
          margem_pct: number
          pdv_nome: string
          resultado: number
        }[]
      }
      ai_get_low_stock_alerts: {
        Args: { _limit?: number; _pdv_ids?: string[]; _threshold?: number }
        Returns: {
          pdv_name: string
          product_name: string
          total_quantity: number
          vendas_30d: number
        }[]
      }
      ai_get_payment_breakdown: {
        Args: { _end: string; _pdv_ids?: string[]; _start: string }
        Returns: {
          faturamento: number
          forma_pagamento: string
          num_vendas: number
          pct_do_pdv: number
          pdv_nome: string
        }[]
      }
      ai_get_pdv_benchmark: {
        Args: { _end: string; _start: string }
        Returns: {
          faturamento: number
          media_rede_fat: number
          media_rede_ticket: number
          media_rede_vendas: number
          num_vendas: number
          pct_vs_media_fat: number
          pct_vs_media_ticket: number
          pdv_nome: string
          ranking: number
          ticket_medio: number
          total_pdvs: number
        }[]
      }
      ai_get_pdv_comparison: {
        Args: { _end: string; _pdv_ids?: string[]; _start: string }
        Returns: {
          pdv_name: string
          revenue: number
          sales_count: number
          ticket_medio: number
        }[]
      }
      ai_get_pdv_list: {
        Args: never
        Returns: {
          is_active: boolean
          pdv_id: string
          pdv_name: string
        }[]
      }
      ai_get_pdv_metrics: {
        Args: { _days?: number }
        Returns: {
          despesas_mes_medio: number
          dias_analisados: number
          faturamento_por_dia: number
          faturamento_total: number
          pdv_nome: string
          taxa_deducao_pct: number
          ticket_medio: number
          total_vendas: number
          vendas_por_dia: number
        }[]
      }
      ai_get_pending_allocations: {
        Args: { _limit?: number; _status?: string }
        Returns: {
          data_criacao: string
          data_resolucao: string
          pdv_destino: string
          produto: string
          qtd_sugerida: number
          status: string
        }[]
      }
      ai_get_pre_stock_detail: {
        Args: { _limit?: number; _status?: string }
        Returns: {
          custo_total: number
          custo_unitario: number
          observacoes: string
          pdv_alocado: string
          product_name: string
          status: string
          total_comprado: number
          total_disponivel: number
          ultima_entrada: string
        }[]
      }
      ai_get_product_catalog: {
        Args: { _category?: string; _limit?: number }
        Returns: {
          category: string
          min_stock: number
          price: number
          product_name: string
          status_estoque: string
          total_em_pdvs: number
          total_pre_stock: number
        }[]
      }
      ai_get_purchases_summary:
        | {
            Args: { _end?: string; _limit?: number; _start?: string }
            Returns: {
              product_name: string
              total_cost: number
              total_pending: number
            }[]
          }
        | {
            Args: {
              _end?: string
              _limit?: number
              _product_names?: string[]
              _start?: string
            }
            Returns: {
              product_name: string
              total_cost: number
              total_pending: number
            }[]
          }
      ai_get_sales_projection: {
        Args: { _days_baseline?: number; _target_net_per_pdv?: number }
        Returns: {
          dias_corridos: number
          dias_restantes: number
          faturamento_ate_hoje: number
          gap_projecao_vs_meta: number
          meta_bruta_necessaria: number
          pdv_nome: string
          projecao_liquida: number
          projecao_mes: number
          status_meta: string
          vendas_ate_hoje: number
          vendas_necessarias: number
          vendas_por_dia_necessarias: number
        }[]
      }
      ai_get_sales_summary: {
        Args: { _end: string; _pdv_ids?: string[]; _start: string }
        Returns: {
          card_revenue: number
          deducoes: number
          faturamento: number
          sales_count: number
          ticket_medio: number
        }[]
      }
      ai_get_sales_timeline: {
        Args: {
          _end: string
          _granularity?: string
          _pdv_ids?: string[]
          _start: string
        }
        Returns: {
          faturamento: number
          num_vendas: number
          pdv_nome: string
          periodo: string
          ticket_medio: number
        }[]
      }
      ai_get_stock_overview: {
        Args: { _limit?: number; _pdv_ids?: string[] }
        Returns: {
          pdv_id: string
          pdv_name: string
          product_name: string
          slot_count: number
          slot_numbers: string
          total_quantity: number
        }[]
      }
      ai_get_stock_redistribution_suggestions:
        | {
            Args: { _limit?: number; _min_coverage_days?: number }
            Returns: {
              cobertura_destino_dias: number
              cobertura_origem_dias: number
              justificativa: string
              pdv_destino: string
              pdv_origem: string
              prioridade: string
              product_name: string
              qtd_sugerida: number
              stock_destino: number
              stock_origem: number
              vendas_30d_destino: number
              vendas_30d_origem: number
            }[]
          }
        | {
            Args: {
              _limit?: number
              _min_coverage_days?: number
              _product_name?: string
            }
            Returns: {
              cobertura_destino_dias: number
              cobertura_origem_dias: number
              justificativa: string
              pdv_destino: string
              pdv_origem: string
              prioridade: string
              product_name: string
              qtd_sugerida: number
              stock_destino: number
              stock_origem: number
              vendas_30d_destino: number
              vendas_30d_origem: number
            }[]
          }
      ai_get_top_products: {
        Args: {
          _end: string
          _limit?: number
          _pdv_ids?: string[]
          _start: string
        }
        Returns: {
          product_name: string
          revenue: number
          sales_count: number
        }[]
      }
      ai_get_upload_status: {
        Args: never
        Returns: {
          anomalias: number
          dias_sem_atualizacao: number
          pdv_nome: string
          registros: number
          status_upload: string
          tipo_upload: string
          ultimo_upload: string
        }[]
      }
      ai_get_zero_stock_items: {
        Args: { _limit?: number; _pdv_ids?: string[] }
        Returns: {
          available_in: string
          network_total_quantity: number
          pdv_id: string
          pdv_name: string
          product_name: string
          slot_count: number
          slot_numbers: string
          stock_in_other_pdvs: number
          total_quantity: number
          zero_scope: string
          zero_slot_count: number
        }[]
      }
      ai_match_knowledge: {
        Args: {
          _match_count?: number
          _query_embedding: string
          _threshold?: number
        }
        Returns: {
          content: string
          id: string
          similarity: number
          source: string
          title: string
        }[]
      }
      can_assign_role: {
        Args: {
          _assigner_id: string
          _new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_org_id: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_annual_dre_summary: {
        Args: { p_pdv_ids: string[]; p_year: number }
        Returns: {
          card_revenue: number
          deducoes: number
          faturamento: number
          month_start: string
          sales_count: number
        }[]
      }
      get_dashboard_charts: {
        Args: { p_end_date: string; p_pdv_ids?: string[]; p_start_date: string }
        Returns: Json
      }
      get_dashboard_kpis: {
        Args: {
          p_end_date: string
          p_pdv_ids?: string[]
          p_prev_end: string
          p_prev_start: string
          p_start_date: string
        }
        Returns: {
          cancelled_transactions: number
          card_revenue: number
          gross_revenue: number
          prev_gross_revenue: number
          prev_total_cancellations: number
          prev_total_refunds: number
          prev_transactions: number
          refunded_transactions: number
          total_cancellations: number
          total_refunds: number
          transactions: number
        }[]
      }
      get_dre_sales_summary: {
        Args: { p_end_date: string; p_pdv_ids: string[]; p_start_date: string }
        Returns: {
          card_revenue: number
          deducoes: number
          faturamento: number
          sales_count: number
        }[]
      }
      get_org_user_ids: { Args: { _user_id: string }; Returns: string[] }
      get_public_organization: {
        Args: { p_slug: string }
        Returns: {
          catalog_code: string
          catalog_code_enabled: boolean
          catalog_modal_text: string
          catalog_pdv_id: string
          catalog_qrcode_url: string
          id: string
          name: string
          pdv_location: string
          pdv_name: string
          public_slug: string
        }[]
      }
      get_public_stock: {
        Args: { p_org_id: string; p_pdv_id?: string }
        Returns: {
          product_name: string
          status: string
        }[]
      }
      get_sales_date_range: {
        Args: { p_pdv_ids?: string[] }
        Returns: {
          max_date: string
          min_date: string
        }[]
      }
      get_super_admin_global_metrics: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          avg_ticket_global: number
          total_organizations: number
          total_pdvs_global: number
          total_refunds_global: number
          total_revenue_global: number
          total_transactions_global: number
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_click_count: {
        Args: { p_short_code: string }
        Returns: {
          short_link_id: string
          target_url: string
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      target_user_is_super_admin: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      user_can_access_pdv: {
        Args: { _pdv_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_org_access: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "org_admin" | "operator" | "viewer"
      audit_event_type:
        | "user_creation_attempt"
        | "user_creation_success"
        | "user_creation_failed"
        | "permission_violation"
        | "organization_creation"
        | "role_assignment"
        | "cross_org_access_granted"
        | "cross_org_access_revoked"
        | "cross_org_access_updated"
        | "ai_agent_config_updated"
        | "ai_agent_tool_updated"
        | "ai_agent_tool_toggled"
        | "ai_agent_config_rollback"
        | "ai_agent_key_tested"
        | "ai_agent_smoke_tested"
      member_status: "active" | "pending" | "inactive"
      pdv_status: "active" | "inactive"
      upload_status: "processing" | "ready" | "error"
      upload_type: "sales" | "stock"
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
      app_role: ["super_admin", "org_admin", "operator", "viewer"],
      audit_event_type: [
        "user_creation_attempt",
        "user_creation_success",
        "user_creation_failed",
        "permission_violation",
        "organization_creation",
        "role_assignment",
        "cross_org_access_granted",
        "cross_org_access_revoked",
        "cross_org_access_updated",
        "ai_agent_config_updated",
        "ai_agent_tool_updated",
        "ai_agent_tool_toggled",
        "ai_agent_config_rollback",
        "ai_agent_key_tested",
        "ai_agent_smoke_tested",
      ],
      member_status: ["active", "pending", "inactive"],
      pdv_status: ["active", "inactive"],
      upload_status: ["processing", "ready", "error"],
      upload_type: ["sales", "stock"],
    },
  },
} as const
