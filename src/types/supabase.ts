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
        }
        Insert: {
          id?: string
          user_id: string
          last_active?: string
          ip_address: string
          device_info: string
          status?: 'pending' | 'approved' | 'denied'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          last_active?: string
          ip_address?: string
          device_info?: string
          status?: 'pending' | 'approved' | 'denied'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "user_blocks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_by_fkey"
            columns: ["blocked_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
}