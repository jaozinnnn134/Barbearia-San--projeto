// Caminho: src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppointmentStatus =
  | "Agendado"
  | "Confirmado"
  | "Em atendimento"
  | "Finalizado"
  | "Cancelado"
  | "Não compareceu";

export type NotificationType =
  | "confirmation"
  | "reminder_30min"
  | "cancellation"
  | "reschedule";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export type ActivityLogAction =
  | "admin_login"
  | "admin_logout"
  | "customer_created"
  | "customer_deleted"
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "appointment_status_changed"
  | "service_created"
  | "service_updated"
  | "service_deleted"
  | "settings_updated"
  | "schedule_blocked"
  | "schedule_unblocked"
  | "setup_completed"
  | "export_generated";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          whatsapp: string | null;
          role: "admin" | "professional";
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          whatsapp?: string | null;
          role?: "admin" | "professional";
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          whatsapp?: string | null;
          role?: "admin" | "professional";
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          duration: number;
          price: number;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          duration: number;
          price: number;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          duration?: number;
          price?: number;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          whatsapp: string;
          total_visits: number;
          total_spent: number;
          last_visit_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          whatsapp: string;
          total_visits?: number;
          total_spent?: number;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          whatsapp?: string;
          total_visits?: number;
          total_spent?: number;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          protocol: string;
          customer_id: string;
          professional_id: string;
          status: AppointmentStatus;
          start_time: string;
          end_time: string;
          total_duration: number;
          total_price: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          protocol: string;
          customer_id: string;
          professional_id: string;
          status?: AppointmentStatus;
          start_time: string;
          end_time: string;
          total_duration: number;
          total_price: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          protocol?: string;
          customer_id?: string;
          professional_id?: string;
          status?: AppointmentStatus;
          start_time?: string;
          end_time?: string;
          total_duration?: number;
          total_price?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_services: {
        Row: {
          id: string;
          appointment_id: string;
          service_id: string;
          price_at_booking: number;
          duration_at_booking: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          service_id: string;
          price_at_booking: number;
          duration_at_booking: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          service_id?: string;
          price_at_booking?: number;
          duration_at_booking?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          appointment_id: string;
          type: NotificationType;
          status: NotificationStatus;
          sent_at: string | null;
          error_message: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          type: NotificationType;
          status?: NotificationStatus;
          sent_at?: string | null;
          error_message?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          type?: NotificationType;
          status?: NotificationStatus;
          sent_at?: string | null;
          error_message?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: {
          id: string;
          profile_id: string;
          day_of_week: number | null;
          start_time: string | null;
          end_time: string | null;
          is_blocked: boolean;
          block_reason: string | null;
          date_override: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          day_of_week?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          is_blocked?: boolean;
          block_reason?: string | null;
          date_override?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          day_of_week?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          is_blocked?: boolean;
          block_reason?: string | null;
          date_override?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          action: ActivityLogAction;
          performed_by: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: ActivityLogAction;
          performed_by?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: ActivityLogAction;
          performed_by?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_appointment_protocol: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      normalize_whatsapp: {
        Args: { phone: string };
        Returns: string;
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      notification_type: NotificationType;
      notification_status: NotificationStatus;
      activity_log_action: ActivityLogAction;
      profile_role: "admin" | "professional";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Service = Tables<"services">;
export type Customer = Tables<"customers">;
export type Setting = Tables<"settings">;
export type Appointment = Tables<"appointments">;
export type AppointmentService = Tables<"appointment_services">;
export type Notification = Tables<"notifications">;
export type Schedule = Tables<"schedules">;
export type ActivityLog = Tables<"activity_logs">;

export interface BusinessHoursConfig {
  timezone: "America/Sao_Paulo";
  regular: {
    tuesday_to_saturday: { start: string; end: string };
    sunday_and_holidays: { start: string; end: string };
    monday: { closed: true };
  };
  slot_interval_minutes: number;
}

export interface HolidaysConfig {
  dates: string[];
}

export interface SetupConfig {
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

export interface SettingValueMap {
  business_hours: BusinessHoursConfig;
  holidays: HolidaysConfig;
  setup: SetupConfig;
  notification_whatsapp_enabled: boolean;
}

export interface AppointmentWithRelations extends Appointment {
  customer: Customer;
  professional: Profile;
  appointment_services: (AppointmentService & { service: Service })[];
}

export interface CustomerWithAppointments extends Customer {
  appointments: Appointment[];
}

export interface DashboardStats {
  clientsToday: number;
  nextAppointment: AppointmentWithRelations | null;
  expectedRevenue: number;
  pendingAppointments: number;
  freeSlotsToday: number;
  totalCustomers: number;
}

export interface BookingCartItem {
  serviceId: string;
  name: string;
  duration: number;
  price: number;
}

export interface BookingState {
  cart: BookingCartItem[];
  professionalId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  customerName: string;
  customerWhatsapp: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface CalendarEventPayload {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  protocol: string;
}
