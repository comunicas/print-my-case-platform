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
      pre_stock: {
        Row: {
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
          updated_at: string
        }
        Insert: {
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
          updated_at?: string
        }
        Update: {
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
          updated_at?: string
        }
        Relationships: []
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
      ],
      member_status: ["active", "pending", "inactive"],
      pdv_status: ["active", "inactive"],
      upload_status: ["processing", "ready", "error"],
      upload_type: ["sales", "stock"],
    },
  },
} as const
