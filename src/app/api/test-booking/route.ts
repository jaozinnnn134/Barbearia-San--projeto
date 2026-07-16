import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { createRepositories } from "@/lib/repositories";
import { BookingService } from "@/lib/services/booking.service";
import {
  createDayBounds,
  generateAvailableSlots,
} from "@/lib/services/scheduling.service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateBookingInput } from "@/lib/validators/booking.schema";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  return NextResponse.json({
    message:
      "Use POST para criar um agendamento de teste com o Supabase configurado.",
  });
}

export async function POST() {
  try {
    const db = createAdminClient();
    const repos = createRepositories(db);
    const bookingService = new BookingService(repos);

    const services = await repos.services.findAllActive();
    if (services.length === 0) {
      throw AppError.notFound(
        "Nenhum serviço ativo encontrado. Cadastre pelo menos um serviço antes do teste.",
      );
    }

    const primaryProfessional =
      (await repos.profiles.findPrimary()) ??
      (await repos.profiles.findAll()).at(0) ??
      null;

    if (!primaryProfessional) {
      throw AppError.notFound(
        "Nenhum profissional encontrado. Cadastre um perfil antes de testar o agendamento.",
      );
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    const date = formatDate(targetDate);

    const totalDuration = services.reduce(
      (accumulator, service) => accumulator + Number(service.duration),
      0,
    );

    const businessHours = await repos.settings.getBusinessHours();
    const holidays = (await repos.settings.getHolidays()).dates;
    const scheduleOverrides = await repos.schedules.findByProfileAndDate(
      primaryProfessional.id,
      date,
    );
    const dayBounds = createDayBounds(date);
    const existingAppointments =
      await repos.appointments.findByProfessionalAndDateRange(
        primaryProfessional.id,
        dayBounds.start,
        dayBounds.end,
      );

    const slots = generateAvailableSlots({
      date,
      totalDurationMinutes: totalDuration,
      businessHours,
      holidays,
      existingAppointments,
      scheduleOverrides,
    });

    const firstAvailableSlot = slots.find((slot) => slot.available);
    if (!firstAvailableSlot) {
      throw AppError.slotUnavailable(
        "Nenhum horário disponível para o agendamento de teste no dia escolhido.",
      );
    }

    const input: CreateBookingInput = {
      serviceIds: services.map((service) => service.id),
      professionalId: primaryProfessional.id,
      date,
      time: firstAvailableSlot.start,
      customerName: "Cliente Teste",
      customerWhatsapp: "11999999999",
    };

    const result = await bookingService.createBooking(input);

    return NextResponse.json({
      success: true,
      protocol: result.protocol,
      customerCreated: result.customerCreated,
      appointmentId: result.appointment.id,
      serviceIds: input.serviceIds,
      professionalId: input.professionalId,
      date: input.date,
      time: input.time,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    );
  }
}
