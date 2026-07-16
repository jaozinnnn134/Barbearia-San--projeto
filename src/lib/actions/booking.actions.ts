"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createRepositories } from "@/lib/repositories";
import { BookingService } from "@/lib/services/booking.service";
import type { CreateBookingInput } from "@/lib/validators/booking.schema";
import {
  actionSuccess,
  actionError,
  type ActionResult,
} from "@/lib/types/actions";
import { getErrorMessage, isAppError } from "@/lib/errors/app-error";
import type { BookingResult } from "@/lib/services/booking.service";
import {
  createDayBounds,
  generateAvailableSlots,
} from "@/lib/services/scheduling.service";
import type { TimeSlot } from "@/types/database.types";

function getBookingService(): BookingService {
  const db = createAdminClient();
  const repos = createRepositories(db);
  return new BookingService(repos);
}

export async function createBookingAction(
  input: CreateBookingInput,
): Promise<ActionResult<BookingResult>> {
  try {
    const service = getBookingService();
    const result = await service.createBooking(input);
    return actionSuccess(result);
  } catch (error) {
    if (isAppError(error)) {
      return actionError(error.message, error.code);
    }
    return actionError(getErrorMessage(error));
  }
}

export async function getBookingAvailabilityAction(input: {
  professionalId: string;
  date: string;
  totalDuration: number;
}): Promise<ActionResult<TimeSlot[]>> {
  try {
    const db = createAdminClient();
    const repos = createRepositories(db);

    const businessHours = await repos.settings.getBusinessHours();
    const holidays = (await repos.settings.getHolidays()).dates;
    const scheduleOverrides = await repos.schedules.findByProfileAndDate(
      input.professionalId,
      input.date,
    );
    const dayBounds = createDayBounds(input.date);
    const existingAppointments = await repos.appointments.findByProfessionalAndDateRange(
      input.professionalId,
      dayBounds.start,
      dayBounds.end,
    );

    const slots = generateAvailableSlots({
      date: input.date,
      totalDurationMinutes: input.totalDuration,
      businessHours,
      holidays,
      existingAppointments,
      scheduleOverrides,
    });

    return actionSuccess(slots);
  } catch (error) {
    if (isAppError(error)) {
      return actionError(error.message, error.code);
    }
    return actionError(getErrorMessage(error));
  }
}

export async function submitBookingFormAction(
  _prevState: ActionResult<BookingResult> | null,
  formData: FormData,
): Promise<ActionResult<BookingResult>> {
  const input: CreateBookingInput = {
    serviceIds: formData.getAll("serviceIds").map(String),
    professionalId: String(formData.get("professionalId") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    customerWhatsapp: String(formData.get("customerWhatsapp") ?? ""),
  };

  return createBookingAction(input);
}
