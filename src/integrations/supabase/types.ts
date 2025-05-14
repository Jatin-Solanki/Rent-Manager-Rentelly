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
      activities: {
        Row: {
          description: string
          enddate: string | null
          id: string
          organization: string
          startdate: string
          title: string
        }
        Insert: {
          description: string
          enddate?: string | null
          id?: string
          organization: string
          startdate: string
          title: string
        }
        Update: {
          description?: string
          enddate?: string | null
          id?: string
          organization?: string
          startdate?: string
          title?: string
        }
        Relationships: []
      }
      lab_members: {
        Row: {
          id: string
          lab_id: string
          name: string
        }
        Insert: {
          id?: string
          lab_id: string
          name: string
        }
        Update: {
          id?: string
          lab_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_members_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_research_areas: {
        Row: {
          id: string
          lab_id: string
          topic: string
        }
        Insert: {
          id?: string
          lab_id: string
          topic: string
        }
        Update: {
          id?: string
          lab_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_research_areas_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          description: string
          id: string
          name: string
        }
        Insert: {
          description: string
          id?: string
          name: string
        }
        Update: {
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string
          education: string
          email: string
          id: string
          imageurl: string
          name: string
          phone: string
          title: string
          university: string
          websiteurl: string | null
        }
        Insert: {
          about: string
          education: string
          email: string
          id?: string
          imageurl: string
          name: string
          phone: string
          title: string
          university: string
          websiteurl?: string | null
        }
        Update: {
          about?: string
          education?: string
          email?: string
          id?: string
          imageurl?: string
          name?: string
          phone?: string
          title?: string
          university?: string
          websiteurl?: string | null
        }
        Relationships: []
      }
      publications: {
        Row: {
          authors: string
          id: string
          journal: string
          title: string
          url: string | null
          year: string
        }
        Insert: {
          authors: string
          id?: string
          journal: string
          title: string
          url?: string | null
          year: string
        }
        Update: {
          authors?: string
          id?: string
          journal?: string
          title?: string
          url?: string | null
          year?: string
        }
        Relationships: []
      }
      research_interests: {
        Row: {
          id: string
          title: string
        }
        Insert: {
          id?: string
          title: string
        }
        Update: {
          id?: string
          title?: string
        }
        Relationships: []
      }
      talks: {
        Row: {
          date: string
          description: string | null
          id: string
          title: string
          venue: string
        }
        Insert: {
          date: string
          description?: string | null
          id?: string
          title: string
          venue: string
        }
        Update: {
          date?: string
          description?: string | null
          id?: string
          title?: string
          venue?: string
        }
        Relationships: []
      }
      teaching_interests: {
        Row: {
          id: string
          title: string
        }
        Insert: {
          id?: string
          title: string
        }
        Update: {
          id?: string
          title?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
