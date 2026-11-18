/**
 * Database and RPC typing snapshot for server queries. Preserve the
 * hand-maintained RPC shapes when regenerating schema-derived types.
 */

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
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      care_tracks: {
        Row: {
          created_at: string
          family_member_id: string
          id: string
          kind: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_member_id: string
          id?: string
          kind: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_member_id?: string
          id?: string
          kind?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'care_tracks_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'care_tracks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      care_visits: {
        Row: {
          care_track_id: string | null
          created_at: string
          family_member_id: string
          id: string
          notes: string
          provider: string
          reason: string
          setting: string
          title: string
          updated_at: string
          user_id: string
          visit_date: string
        }
        Insert: {
          care_track_id?: string | null
          created_at?: string
          family_member_id: string
          id?: string
          notes?: string
          provider?: string
          reason?: string
          setting: string
          title: string
          updated_at?: string
          user_id: string
          visit_date: string
        }
        Update: {
          care_track_id?: string | null
          created_at?: string
          family_member_id?: string
          id?: string
          notes?: string
          provider?: string
          reason?: string
          setting?: string
          title?: string
          updated_at?: string
          user_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'care_visits_care_track_id_user_id_family_member_id_fkey'
            columns: ['care_track_id', 'user_id', 'family_member_id']
            isOneToOne: false
            referencedRelation: 'care_tracks'
            referencedColumns: ['id', 'user_id', 'family_member_id']
          },
          {
            foreignKeyName: 'care_visits_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'care_visits_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      family_health_profiles: {
        Row: {
          allergies: string
          blood_group: string | null
          conditions: string
          created_at: string
          emergency_contact_name: string
          emergency_contact_phone: string
          family_member_id: string
          gender: string | null
          height_cm: number | null
          medical_background: Json | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          allergies?: string
          blood_group?: string | null
          conditions?: string
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          family_member_id: string
          gender?: string | null
          height_cm?: number | null
          medical_background?: Json | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          allergies?: string
          blood_group?: string | null
          conditions?: string
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          family_member_id?: string
          gender?: string | null
          height_cm?: number | null
          medical_background?: Json | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'family_health_profiles_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'family_health_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      health_metrics: {
        Row: {
          created_at: string
          family_member_id: string
          id: string
          measured_at: string
          notes: string
          secondary_value: number | null
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          family_member_id: string
          id?: string
          measured_at: string
          notes?: string
          secondary_value?: number | null
          type: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          family_member_id?: string
          id?: string
          measured_at?: string
          notes?: string
          secondary_value?: number | null
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'health_metrics_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'health_metrics_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      health_profiles: {
        Row: {
          allergies: string
          blood_group: string | null
          conditions: string
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          medical_background: Json | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          allergies?: string
          blood_group?: string | null
          conditions?: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string
          emergency_contact_phone?: string
          full_name: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          medical_background?: Json | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          allergies?: string
          blood_group?: string | null
          conditions?: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string
          emergency_contact_phone?: string
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          medical_background?: Json | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'health_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      medical_records: {
        Row: {
          category: string
          created_at: string
          document_kind: string
          family_member_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_favourite: boolean
          provider: string
          record_date: string
          title: string
          updated_at: string
          user_id: string
          visit_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          document_kind?: string
          family_member_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_favourite?: boolean
          provider?: string
          record_date: string
          title: string
          updated_at?: string
          user_id: string
          visit_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          document_kind?: string
          family_member_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_favourite?: boolean
          provider?: string
          record_date?: string
          title?: string
          updated_at?: string
          user_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'medical_records_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'medical_records_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'medical_records_visit_id_user_id_family_member_id_fkey'
            columns: ['visit_id', 'user_id', 'family_member_id']
            isOneToOne: false
            referencedRelation: 'care_visits'
            referencedColumns: ['id', 'user_id', 'family_member_id']
          },
        ]
      }
      medication_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          medication_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          medication_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          medication_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'medication_logs_medication_id_user_id_fkey'
            columns: ['medication_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'medications'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'medication_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          family_member_id: string
          form: string
          frequency: string
          id: string
          instructions: string
          name: string
          prescription_text: string
          source_record_id: string | null
          start_date: string
          strength: string
          times: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          family_member_id: string
          form?: string
          frequency: string
          id?: string
          instructions?: string
          name: string
          prescription_text?: string
          source_record_id?: string | null
          start_date: string
          strength?: string
          times: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          family_member_id?: string
          form?: string
          frequency?: string
          id?: string
          instructions?: string
          name?: string
          prescription_text?: string
          source_record_id?: string | null
          start_date?: string
          strength?: string
          times?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'medications_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'medications_source_record_id_user_id_family_member_id_fkey'
            columns: ['source_record_id', 'user_id', 'family_member_id']
            isOneToOne: false
            referencedRelation: 'medical_records'
            referencedColumns: ['id', 'user_id', 'family_member_id']
          },
          {
            foreignKeyName: 'medications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_reminders_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_deliveries: {
        Row: {
          attempted_at: string
          created_at: string
          id: string
          medication_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempted_at: string
          created_at?: string
          id?: string
          medication_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          created_at?: string
          id?: string
          medication_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminder_deliveries_medication_id_user_id_fkey'
            columns: ['medication_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'medications'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'reminder_deliveries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      visit_follow_ups: {
        Row: {
          completed_visit_id: string | null
          created_at: string
          due_date: string
          family_member_id: string
          id: string
          instruction: string
          source_record_id: string | null
          status: string
          updated_at: string
          user_id: string
          visit_id: string
        }
        Insert: {
          completed_visit_id?: string | null
          created_at?: string
          due_date: string
          family_member_id: string
          id?: string
          instruction?: string
          source_record_id?: string | null
          status: string
          updated_at?: string
          user_id: string
          visit_id: string
        }
        Update: {
          completed_visit_id?: string | null
          created_at?: string
          due_date?: string
          family_member_id?: string
          id?: string
          instruction?: string
          source_record_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'visit_follow_ups_completed_visit_id_user_id_family_member__fkey'
            columns: ['completed_visit_id', 'user_id', 'family_member_id']
            isOneToOne: false
            referencedRelation: 'care_visits'
            referencedColumns: ['id', 'user_id', 'family_member_id']
          },
          {
            foreignKeyName: 'visit_follow_ups_family_member_id_user_id_fkey'
            columns: ['family_member_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'visit_follow_ups_source_visit_owner_profile_fkey'
            columns: [
              'source_record_id',
              'user_id',
              'family_member_id',
              'visit_id',
            ]
            isOneToOne: false
            referencedRelation: 'medical_records'
            referencedColumns: ['id', 'user_id', 'family_member_id', 'visit_id']
          },
          {
            foreignKeyName: 'visit_follow_ups_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'visit_follow_ups_visit_id_user_id_family_member_id_fkey'
            columns: ['visit_id', 'user_id', 'family_member_id']
            isOneToOne: false
            referencedRelation: 'care_visits'
            referencedColumns: ['id', 'user_id', 'family_member_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_reviewed_results: {
        Args: never
        Returns: Json
      }
      save_reviewed_results: {
        Args: {
          p_record_id: string
          p_measured_on: string
          p_results: Json
          p_confirm_blood_group_change?: boolean
        }
        Returns: Json
      }
      check_app_readiness: {
        Args: never
        Returns: boolean
      }
      claim_reminder_delivery: {
        Args: {
          p_attempted_at: string
          p_medication_id: string
          p_scheduled_date: string
          p_scheduled_time: string
          p_user_id: string
        }
        Returns: {
          attempted_at: string
          id: string
        }[]
      }
      complete_reminder_delivery: {
        Args: { p_attempted_at: string; p_delivered: boolean; p_id: string }
        Returns: boolean
      }
      get_account_export_data: {
        Args: never
        Returns: AccountExportSnapshot
      }
      get_account_vault_data: {
        Args: never
        Returns: AccountVaultSnapshot
      }
      get_due_reminder_candidates: {
        Args: { p_now?: string }
        Returns: {
          medication_id: string
          scheduled_date: string
          scheduled_time: string
          timezone: string
          user_id: string
        }[]
      }
      save_visit_follow_up: {
        Args: {
          p_completed_visit_id?: string
          p_due_date: string
          p_instruction: string
          p_source_record_id?: string
          p_status: string
          p_visit_id: string
        }
        Returns: {
          completed_visit_id: string | null
          created_at: string
          due_date: string
          family_member_id: string
          id: string
          instruction: string
          source_record_id: string | null
          status: string
          updated_at: string
          user_id: string
          visit_id: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'visit_follow_ups'
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type AccountVaultSnapshot = {
  profile: Database['public']['Tables']['profiles']['Row']
  notificationPreferences: Database['public']['Tables']['notification_preferences']['Row']
  familyMembers: Database['public']['Tables']['family_members']['Row'][]
  healthProfile: Database['public']['Tables']['health_profiles']['Row'] | null
  familyHealthProfiles: Database['public']['Tables']['family_health_profiles']['Row'][]
  records: Database['public']['Tables']['medical_records']['Row'][]
  medications: Database['public']['Tables']['medications']['Row'][]
  logs: Database['public']['Tables']['medication_logs']['Row'][]
  careTracks: Database['public']['Tables']['care_tracks']['Row'][]
  visits: Database['public']['Tables']['care_visits']['Row'][]
  followUps: Database['public']['Tables']['visit_follow_ups']['Row'][]
}

export type AccountExportSnapshot = {
  exported_at: string
  profile: Database['public']['Tables']['profiles']['Row']
  family_members: Database['public']['Tables']['family_members']['Row'][]
  health_profile: Database['public']['Tables']['health_profiles']['Row'] | null
  family_health_profiles: Database['public']['Tables']['family_health_profiles']['Row'][]
  medical_records: Database['public']['Tables']['medical_records']['Row'][]
  medications: Database['public']['Tables']['medications']['Row'][]
  medication_logs: Database['public']['Tables']['medication_logs']['Row'][]
  care_tracks: Database['public']['Tables']['care_tracks']['Row'][]
  care_visits: Database['public']['Tables']['care_visits']['Row'][]
  visit_follow_ups: Database['public']['Tables']['visit_follow_ups']['Row'][]
  archived_health_metrics: Database['public']['Tables']['health_metrics']['Row'][]
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
