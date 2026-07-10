import type { ChangeOrderStatus, DocumentType } from "@/lib/change-order";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          business_name: string;
          contact_email: string;
          phone: string;
          default_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          business_name?: string;
          contact_email?: string;
          phone?: string;
          default_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          business_name?: string;
          contact_email?: string;
          phone?: string;
          default_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      change_orders: {
        Row: {
          id: string;
          user_id: string;
          document_type: DocumentType;
          title: string;
          client_name: string;
          project_name: string;
          status: ChangeOrderStatus;
          input: Json;
          total: number | string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type?: DocumentType;
          title: string;
          client_name?: string;
          project_name?: string;
          status?: ChangeOrderStatus;
          input: Json;
          total?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: DocumentType;
          title?: string;
          client_name?: string;
          project_name?: string;
          status?: ChangeOrderStatus;
          input?: Json;
          total?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "change_orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
