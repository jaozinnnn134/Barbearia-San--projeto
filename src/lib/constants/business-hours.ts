import type { BusinessHoursConfig } from "@/types/database.types";

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  timezone: "America/Sao_Paulo",
  regular: {
    tuesday_to_saturday: { start: "09:00", end: "19:00" },
    sunday_and_holidays: { start: "09:00", end: "12:00" },
    monday: { closed: true },
  },
  slot_interval_minutes: 10,
};

export const ACTIVE_APPOINTMENT_STATUSES = [
  "Agendado",
  "Confirmado",
  "Em atendimento",
  "Finalizado",
] as const;

export const BLOCKING_APPOINTMENT_STATUSES = [
  "Agendado",
  "Confirmado",
  "Em atendimento",
] as const;
