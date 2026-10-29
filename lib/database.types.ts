export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          detail: NonNullable<Json>;
          entity_id: string | null;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: NonNullable<Json>;
          entity_id?: string | null;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: NonNullable<Json>;
          entity_id?: string | null;
          id?: never;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_events_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      driver_assessments: {
        Row: {
          answers: NonNullable<Json>;
          created_at: string;
          driver_id: string;
          id: string;
          shift_id: string;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          answers: NonNullable<Json>;
          created_at?: string;
          driver_id: string;
          id?: string;
          shift_id: string;
          version: string;
        };
        Update: {
          answers?: NonNullable<Json>;
          created_at?: string;
          driver_id?: string;
          id?: string;
          shift_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'driver_assessments_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'driver_assessments_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: true;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
        ];
      };
      evidence_upload_intents: {
        Row: {
          claimed_at: string | null;
          created_at: string;
          expected_bytes: number;
          expires_at: string;
          id: string;
          kind: string;
          mime_type: string;
          owner_id: string;
          path: string;
          shift_id: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          claimed_at?: string | null;
          created_at?: string;
          expected_bytes: number;
          expires_at: string;
          id?: string;
          kind: string;
          mime_type: string;
          owner_id: string;
          path: string;
          shift_id: string;
          status?: string;
        };
        Update: {
          claimed_at?: string | null;
          created_at?: string;
          expected_bytes?: number;
          expires_at?: string;
          id?: string;
          kind?: string;
          mime_type?: string;
          owner_id?: string;
          path?: string;
          shift_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'evidence_upload_intents_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evidence_upload_intents_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
        ];
      };
      evidences: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          item_id: string | null;
          kind: string;
          owner_id: string;
          path: string;
          shift_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id: string;
          item_id?: string | null;
          kind: string;
          owner_id: string;
          path: string;
          shift_id: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          item_id?: string | null;
          kind?: string;
          owner_id?: string;
          path?: string;
          shift_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'evidences_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evidences_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
        ];
      };
      field_transfers: {
        Row: {
          actor_id: string;
          created_at: string;
          destination_id: string;
          entity_id: string;
          entity_type: string;
          id: string;
          origin_id: string;
          reason: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          created_at?: string;
          destination_id: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          origin_id: string;
          reason: string;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          destination_id?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          origin_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'field_transfers_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'field_transfers_destination_id_fkey';
            columns: ['destination_id'];
            isOneToOne: false;
            referencedRelation: 'fields';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'field_transfers_origin_id_fkey';
            columns: ['origin_id'];
            isOneToOne: false;
            referencedRelation: 'fields';
            referencedColumns: ['id'];
          },
        ];
      };
      fields: {
        Row: {
          active: boolean;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          id?: string;
          name: string;
        };
        Update: {
          active?: boolean;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      form_items: {
        Row: {
          category: string;
          id: string;
          label: string;
          position: number;
          sources: NonNullable<Json>;
          template_id: string;
          vehicle_type: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          id: string;
          label: string;
          position: number;
          sources: NonNullable<Json>;
          template_id: string;
          vehicle_type: string;
        };
        Update: {
          category?: string;
          id?: string;
          label?: string;
          position?: number;
          sources?: NonNullable<Json>;
          template_id?: string;
          vehicle_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'form_items_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'form_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      form_templates: {
        Row: {
          created_at: string;
          id: string;
          status: string;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          status: string;
          version: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          status?: string;
          version?: string;
        };
        Relationships: [];
      };
      incident_actions: {
        Row: {
          actor_id: string;
          comment: string;
          created_at: string;
          id: string;
          incident_id: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          comment: string;
          created_at?: string;
          id?: string;
          incident_id: string;
          status: string;
        };
        Update: {
          actor_id?: string;
          comment?: string;
          created_at?: string;
          id?: string;
          incident_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'incident_actions_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incident_actions_incident_id_fkey';
            columns: ['incident_id'];
            isOneToOne: false;
            referencedRelation: 'incidents';
            referencedColumns: ['id'];
          },
        ];
      };
      incidents: {
        Row: {
          created_at: string;
          description: string;
          driver_id: string;
          id: string;
          shift_id: string;
          status: string;
          usage_id: string;
          vehicle_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description: string;
          driver_id: string;
          id?: string;
          shift_id: string;
          status?: string;
          usage_id: string;
          vehicle_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          driver_id?: string;
          id?: string;
          shift_id?: string;
          status?: string;
          usage_id?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'incidents_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_usage_id_fkey';
            columns: ['usage_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_usages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
      inspection_answers: {
        Row: {
          inspection_id: string;
          item_id: string;
          observation: string;
          rating: string;
        };
        ComputedFields: never;
        Insert: {
          inspection_id: string;
          item_id: string;
          observation?: string;
          rating: string;
        };
        Update: {
          inspection_id?: string;
          item_id?: string;
          observation?: string;
          rating?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inspection_answers_inspection_id_fkey';
            columns: ['inspection_id'];
            isOneToOne: false;
            referencedRelation: 'inspections';
            referencedColumns: ['id'];
          },
        ];
      };
      inspections: {
        Row: {
          created_at: string;
          driver_id: string;
          id: string;
          kind: string;
          odometer: number;
          shift_id: string;
          signature_id: string | null;
          template_id: string;
          usage_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          driver_id: string;
          id?: string;
          kind: string;
          odometer: number;
          shift_id: string;
          signature_id?: string | null;
          template_id: string;
          usage_id: string;
        };
        Update: {
          created_at?: string;
          driver_id?: string;
          id?: string;
          kind?: string;
          odometer?: number;
          shift_id?: string;
          signature_id?: string | null;
          template_id?: string;
          usage_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inspections_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inspections_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inspections_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'form_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inspections_usage_id_fkey';
            columns: ['usage_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_usages';
            referencedColumns: ['id'];
          },
        ];
      };
      odometer_corrections: {
        Row: {
          actor_id: string;
          corrected_value: number;
          created_at: string;
          id: string;
          original_value: number;
          reading: string;
          reason: string;
          usage_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          corrected_value: number;
          created_at?: string;
          id?: string;
          original_value: number;
          reading: string;
          reason: string;
          usage_id: string;
        };
        Update: {
          actor_id?: string;
          corrected_value?: number;
          created_at?: string;
          id?: string;
          original_value?: number;
          reading?: string;
          reason?: string;
          usage_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'odometer_corrections_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'odometer_corrections_usage_id_fkey';
            columns: ['usage_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_usages';
            referencedColumns: ['id'];
          },
        ];
      };
      operation_drafts: {
        Row: {
          data: NonNullable<Json>;
          kind: string;
          owner_id: string;
          shift_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          data: NonNullable<Json>;
          kind: string;
          owner_id: string;
          shift_id: string;
          updated_at?: string;
        };
        Update: {
          data?: NonNullable<Json>;
          kind?: string;
          owner_id?: string;
          shift_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operation_drafts_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operation_drafts_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          active: boolean;
          alias: string;
          email: string;
          field_id: string | null;
          full_name: string;
          id: string;
          invalid_before: number;
          must_change_password: boolean;
          phone: string;
          reset_in_progress: boolean;
          role: Database['public']['Enums']['app_role'];
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          alias: string;
          email: string;
          field_id?: string | null;
          full_name: string;
          id: string;
          invalid_before?: number;
          must_change_password?: boolean;
          phone?: string;
          reset_in_progress?: boolean;
          role: Database['public']['Enums']['app_role'];
        };
        Update: {
          active?: boolean;
          alias?: string;
          email?: string;
          field_id?: string | null;
          full_name?: string;
          id?: string;
          invalid_before?: number;
          must_change_password?: boolean;
          phone?: string;
          reset_in_progress?: boolean;
          role?: Database['public']['Enums']['app_role'];
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'fields';
            referencedColumns: ['id'];
          },
        ];
      };
      retention_policies: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          category: string;
          enabled: boolean;
          retention_days: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          category: string;
          enabled?: boolean;
          retention_days?: number | null;
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          category?: string;
          enabled?: boolean;
          retention_days?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      shifts: {
        Row: {
          closed_at: string | null;
          created_at: string;
          driver_id: string;
          field_id: string;
          id: string;
          missing: Json | null;
          opened_at: string | null;
          regularization_reason: string | null;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          closed_at?: string | null;
          created_at?: string;
          driver_id: string;
          field_id: string;
          id?: string;
          missing?: Json | null;
          opened_at?: string | null;
          regularization_reason?: string | null;
          status?: string;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string;
          driver_id?: string;
          field_id?: string;
          id?: string;
          missing?: Json | null;
          opened_at?: string | null;
          regularization_reason?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shifts_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shifts_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'fields';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicle_change_authorizations: {
        Row: {
          actor_id: string;
          created_at: string;
          id: string;
          old_usage_id: string;
          reason: string;
          replacement_id: string;
          shift_id: string;
          used_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          created_at?: string;
          id?: string;
          old_usage_id: string;
          reason: string;
          replacement_id: string;
          shift_id: string;
          used_at?: string | null;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          id?: string;
          old_usage_id?: string;
          reason?: string;
          replacement_id?: string;
          shift_id?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicle_change_authorizations_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_change_authorizations_old_usage_id_fkey';
            columns: ['old_usage_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_usages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_change_authorizations_replacement_id_fkey';
            columns: ['replacement_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_change_authorizations_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicle_documents: {
        Row: {
          created_at: string;
          expires_on: string | null;
          id: string;
          name: string;
          required: boolean;
          vehicle_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expires_on?: string | null;
          id?: string;
          name: string;
          required?: boolean;
          vehicle_id: string;
        };
        Update: {
          created_at?: string;
          expires_on?: string | null;
          id?: string;
          name?: string;
          required?: boolean;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicle_documents_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicle_restrictions: {
        Row: {
          actor_id: string;
          created_at: string;
          id: string;
          lift_reason: string | null;
          lifted_at: string | null;
          lifted_by: string | null;
          reason: string;
          vehicle_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          created_at?: string;
          id?: string;
          lift_reason?: string | null;
          lifted_at?: string | null;
          lifted_by?: string | null;
          reason: string;
          vehicle_id: string;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          id?: string;
          lift_reason?: string | null;
          lifted_at?: string | null;
          lifted_by?: string | null;
          reason?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicle_restrictions_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_restrictions_lifted_by_fkey';
            columns: ['lifted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_restrictions_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicle_usages: {
        Row: {
          delivered_at: string | null;
          end_km: number | null;
          field_id: string;
          id: string;
          plate_snapshot: string;
          received_at: string;
          shift_id: string;
          start_km: number;
          vehicle_id: string;
        };
        ComputedFields: never;
        Insert: {
          delivered_at?: string | null;
          end_km?: number | null;
          field_id: string;
          id?: string;
          plate_snapshot: string;
          received_at?: string;
          shift_id: string;
          start_km: number;
          vehicle_id: string;
        };
        Update: {
          delivered_at?: string | null;
          end_km?: number | null;
          field_id?: string;
          id?: string;
          plate_snapshot?: string;
          received_at?: string;
          shift_id?: string;
          start_km?: number;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicle_usages_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'fields';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_usages_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_usages_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicles: {
        Row: {
          active: boolean;
          description: string;
          field_id: string;
          fitness: string;
          id: string;
          odometer: number;
          plate: string;
          vehicle_type: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          description: string;
          field_id: string;
          fitness?: string;
          id?: string;
          odometer?: number;
          plate: string;
          vehicle_type: string;
        };
        Update: {
          active?: boolean;
          description?: string;
          field_id?: string;
          fitness?: string;
          id?: string;
          odometer?: number;
          plate?: string;
          vehicle_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicles_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'fields';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_evidence_upload_intent: {
        Args: {
          expected_bytes_input: number;
          kind_input: string;
          mime_type_input: string;
          shift_id_input: string;
        };
        Returns: {
          expires_at: string;
          id: string;
          path: string;
        }[];
      };
      execute_command: {
        Args: { action: string; payload: Json; request_id: string };
        Returns: Json;
      };
      finalize_evidence_upload_intent: { Args: { intent_id_input: string }; Returns: string };
      provision_profile: {
        Args: { actor_id: string; data: Json; user_id: string };
        Returns: undefined;
      };
      reset_password_guard: {
        Args: { actor_id: string; phase: string; target_id: string };
        Returns: undefined;
      };
      resolve_login: {
        Args: { alias_input: string; identifier_key: string; network_key: string };
        Returns: string;
      };
      save_draft: { Args: { data: Json; kind: string; shift_id: string }; Returns: undefined };
      vehicle_availability: {
        Args: Record<PropertyKey, never>;
        Returns: {
          eligible: boolean;
          in_use: boolean;
          vehicle_id: string;
        }[];
      };
    };
    Enums: {
      app_role: 'driver' | 'fleet_admin' | 'management' | 'it_superadmin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['driver', 'fleet_admin', 'management', 'it_superadmin'],
    },
  },
} as const;
