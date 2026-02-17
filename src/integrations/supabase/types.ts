export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      content_history: {
        Row: {
          created_at: string
          cta: string | null
          hashtags: string[]
          headline: string
          id: string
          image_prompt: string | null
          image_url: string | null
          platform: string
          post: string
          template: string | null
          tone: string
          topic: string
          user_id: string
          team_id: string | null
          slides: Json | null
          section_images: Json | null
          carousel: boolean | null
          full_article: boolean | null
        }
        Insert: {
          created_at?: string
          cta?: string | null
          hashtags?: string[]
          headline: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          platform: string
          post: string
          template?: string | null
          tone: string
          topic: string
          user_id: string
          team_id?: string | null
          slides?: Json | null
          section_images?: Json | null
          carousel?: boolean | null
          full_article?: boolean | null
        }
        Update: {
          created_at?: string
          cta?: string | null
          hashtags?: string[]
          headline?: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          platform?: string
          post?: string
          template?: string | null
          tone?: string
          topic?: string
          user_id?: string
          team_id?: string | null
          slides?: Json | null
          section_images?: Json | null
          carousel?: boolean | null
          full_article?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "content_history_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          custom_openai_key: string | null
          custom_gemini_key: string | null
          credits_balance: number
          bio: string | null
          monthly_usage_count: number
          last_usage_reset: string
          team_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          user_id: string
          role?: Database["public"]["Enums"]["user_role"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          custom_openai_key?: string | null
          custom_gemini_key?: string | null
          credits_balance?: number
          bio?: string | null
          monthly_usage_count?: number
          last_usage_reset?: string
          team_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          custom_openai_key?: string | null
          custom_gemini_key?: string | null
          credits_balance?: number
          bio?: string | null
          monthly_usage_count?: number
          last_usage_reset?: string
          team_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          plan_name: string
          amount: number
          payment_method: string
          proof_url: string | null
          transaction_id: string | null
          status: "pending" | "approved" | "rejected"
          admin_notes: string | null
          created_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          plan_name: string
          amount: number
          payment_method: string
          proof_url?: string | null
          transaction_id?: string | null
          status?: "pending" | "approved" | "rejected"
          admin_notes?: string | null
          created_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          plan_name?: string
          amount?: number
          payment_method?: string
          proof_url?: string | null
          transaction_id?: string | null
          status?: "pending" | "approved" | "rejected"
          admin_notes?: string | null
          created_at?: string
          approved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          user_id: string
          subject: string
          content: string
          status: "pending" | "investigating" | "resolved"
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          content: string
          status?: "pending" | "investigating" | "resolved"
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          content?: string
          status?: "pending" | "investigating" | "resolved"
          admin_notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_user_is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "super_admin" | "admin" | "moderator" | "user"
      subscription_tier: "free" | "starter" | "pro" | "unlimited" | "lifetime"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
