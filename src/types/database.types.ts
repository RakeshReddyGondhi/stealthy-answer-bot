export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_sessions: {
        Row: {
          id: string
          user_id: string
          last_active: string
          ip_address: string
          device_info: string
          status: 'pending' | 'approved' | 'denied'
          created_at: string
          session_data: Json | null
          voice_file_url: string | null
          transcribed_text: string | null
          ai_response: string | null
          request_type: 'help' | 'chat' | 'other' | null
          voice_duration: number | null
        }
        Insert: {
          id?: string
          user_id: string
          last_active?: string
          ip_address: string
          device_info: string
          status?: 'pending' | 'approved' | 'denied'
          created_at?: string
          session_data?: Json | null
          voice_file_url?: string | null
          transcribed_text?: string | null
          ai_response?: string | null
          request_type?: 'help' | 'chat' | 'other' | null
          voice_duration?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          last_active?: string
          ip_address?: string
          device_info?: string
          status?: 'pending' | 'approved' | 'denied'
          created_at?: string
          session_data?: Json | null
          voice_file_url?: string | null
          transcribed_text?: string | null
          ai_response?: string | null
          request_type?: 'help' | 'chat' | 'other' | null
          voice_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_controls: {
        Row: {
          id: string
          global_lock: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          global_lock: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          global_lock?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_blocks: {
        Row: {
          id: string
          user_id: string
          reason: string
          blocked_by: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reason: string
          blocked_by: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reason?: string
          blocked_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_blocked: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      session_status: 'pending' | 'processing' | 'completed' | 'error'
      request_type: 'help' | 'chat' | 'other'
    }
  }
}