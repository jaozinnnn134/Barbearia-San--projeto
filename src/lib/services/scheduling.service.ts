import {
  addMinutes,
  format,
  getDay,
  isBefore,
  parse,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import type {
  Appointment,
  BookingCartItem,
  BusinessHoursConfig,
  Schedule,
  TimeSlot,
} from "@/types/database.types";

export interface DayScheduleWindow {
  open: boolean;
  start: string;
  end: string;
  reason?: string;
}

export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return digits;
  }

  return digits;
}

export function formatWhatsappMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function sumCartDuration(items: BookingCartItem[]): number {
  return items.reduce((total, item) => total + item.duration, 0);
}

export function sumCartPrice(items: BookingCartItem[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isHoliday(dateStr: string, holidays: string[]): boolean {
  return holidays.includes(dateStr);
}

export function getDayScheduleWindow(
  dateStr: string,
  businessHours: BusinessHoursConfig,
  holidays: string[],
  scheduleOverrides: Schedule[] = [],
): DayScheduleWindow {
  const blockedOverride = scheduleOverrides.find(
    (s) => s.date_override === dateStr && s.is_blocked,
  );

  if (blockedOverride) {
    return {
      open: false,
      start: "00:00",
      end: "00:00",
      reason: blockedOverride.block_reason ?? "Dia bloqueado",
    };
  }

  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayOfWeek = getDay(date);

  if (dayOfWeek === 1) {
    return { open: false, start: "00:00", end: "00:00", reason: "Segunda-feira — fechado" };
  }

  if (dayOfWeek === 0 || isHoliday(dateStr, holidays)) {
    return {
      open: true,
      start: businessHours.regular.sunday_and_holidays.start,
      end: businessHours.regular.sunday_and_holidays.end,
    };
  }

  if (dayOfWeek >= 2 && dayOfWeek <= 6) {
    return {
      open: true,
      start: businessHours.regular.tuesday_to_saturday.start,
      end: businessHours.regular.tuesday_to_saturday.end,
    };
  }

  return { open: false, start: "00:00", end: "00:00", reason: "Dia indisponível" };
}

export function buildZonedDateTime(dateStr: string, time: string): Date {
  const local = parse(`${dateStr} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  return fromZonedTime(local, APP_TIMEZONE);
}

export function hasTimeOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

export function isSlotBlockedByAppointments(
  slotStart: Date,
  slotEnd: Date,
  appointments: Appointment[],
): boolean {
  return appointments.some((appointment) =>
    hasTimeOverlap(
      slotStart,
      slotEnd,
      new Date(appointment.start_time),
      new Date(appointment.end_time),
    ),
  );
}

export function generateAvailableSlots(params: {
  date: string;
  totalDurationMinutes: number;
  businessHours: BusinessHoursConfig;
  holidays: string[];
  existingAppointments: Appointment[];
  scheduleOverrides?: Schedule[];
  now?: Date;
}): TimeSlot[] {
  const {
    date,
    totalDurationMinutes,
    businessHours,
    holidays,
    existingAppointments,
    scheduleOverrides = [],
    now = new Date(),
  } = params;

  const window = getDayScheduleWindow(date, businessHours, holidays, scheduleOverrides);

  if (!window.open || totalDurationMinutes <= 0) {
    return [];
  }

  const interval = businessHours.slot_interval_minutes;
  const openMinutes = parseTimeToMinutes(window.start);
  const closeMinutes = parseTimeToMinutes(window.end);
  const slots: TimeSlot[] = [];

  const zonedNow = toZonedTime(now, APP_TIMEZONE);
  const todayStr = format(zonedNow, "yyyy-MM-dd");
  const isToday = date === todayStr;

  for (
    let cursor = openMinutes;
    cursor + totalDurationMinutes <= closeMinutes;
    cursor += interval
  ) {
    const time = minutesToTime(cursor);
    const slotStart = buildZonedDateTime(date, time);
    const slotEnd = addMinutes(slotStart, totalDurationMinutes);

    if (isToday && isBefore(slotStart, now)) {
      continue;
    }

    const available = !isSlotBlockedByAppointments(
      slotStart,
      slotEnd,
      existingAppointments,
    );

    slots.push({
      start: time,
      end: minutesToTime(cursor + totalDurationMinutes),
      available,
    });
  }

  return slots;
}

export function getAvailableSlotsOnly(slots: TimeSlot[]): TimeSlot[] {
  return slots.filter((slot) => slot.available);
}

export function validateSlotAvailability(
  date: string,
  time: string,
  totalDurationMinutes: number,
  businessHours: BusinessHoursConfig,
  holidays: string[],
  existingAppointments: Appointment[],
  scheduleOverrides: Schedule[] = [],
): boolean {
  const slots = generateAvailableSlots({
    date,
    totalDurationMinutes,
    businessHours,
    holidays,
    existingAppointments,
    scheduleOverrides,
  });

  const match = slots.find((s) => s.start === time);
  return match?.available === true;
}

export function buildAppointmentTimes(
  date: string,
  time: string,
  totalDurationMinutes: number,
): { startTime: Date; endTime: Date } {
  const startTime = buildZonedDateTime(date, time);
  const endTime = addMinutes(startTime, totalDurationMinutes);
  return { startTime, endTime };
}

export function formatDisplayDate(dateStr: string): string {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  return format(date, "dd/MM/yyyy");
}

export function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}

export function createDayBounds(dateStr: string): { start: string; end: string } {
  const startLocal = parse(`${dateStr} 00:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
  const endLocal = parse(`${dateStr} 23:59:59`, "yyyy-MM-dd HH:mm:ss", new Date());

  return {
    start: fromZonedTime(startLocal, APP_TIMEZONE).toISOString(),
    end: fromZonedTime(endLocal, APP_TIMEZONE).toISOString(),
  };
}
