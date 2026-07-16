import type { Repositories } from "@/lib/repositories";
import { createBookingSchema, type CreateBookingInput } from "@/lib/validators/booking.schema";
import {
  buildAppointmentTimes,
  normalizeWhatsapp,
  sumCartDuration,
  sumCartPrice,
  validateSlotAvailability,
  createDayBounds,
} from "@/lib/services/scheduling.service";
import { generateProtocol } from "@/lib/services/protocol.service";
import { AppError } from "@/lib/errors/app-error";
import type { Appointment, Service } from "@/types/database.types";

export interface BookingResult {
  appointment: Appointment;
  protocol: string;
  customerCreated: boolean;
}

export class BookingService {
  constructor(private readonly repos: Repositories) {}

  async createBooking(rawInput: CreateBookingInput): Promise<BookingResult> {
    const input = createBookingSchema.parse(rawInput);

    const services = await this.repos.services.findByIds(input.serviceIds);
    if (services.length !== input.serviceIds.length) {
      throw AppError.validation("Um ou mais serviços selecionados são inválidos.");
    }

    const professional = await this.repos.profiles.findById(input.professionalId);
    if (!professional) {
      throw AppError.notFound("Profissional não encontrado.");
    }

    const businessHours = await this.repos.settings.getBusinessHours();
    const holidays = (await this.repos.settings.getHolidays()).dates;
    const scheduleOverrides = await this.repos.schedules.findByProfileAndDate(
      input.professionalId,
      input.date,
    );

    const totalDuration = sumCartDuration(this.mapServicesToCart(services));
    const totalPrice = sumCartPrice(this.mapServicesToCart(services));

    const dayBounds = createDayBounds(input.date);
    const existingAppointments =
      await this.repos.appointments.findByProfessionalAndDateRange(
        input.professionalId,
        dayBounds.start,
        dayBounds.end,
      );

    const isAvailable = validateSlotAvailability(
      input.date,
      input.time,
      totalDuration,
      businessHours,
      holidays,
      existingAppointments,
      scheduleOverrides,
    );

    if (!isAvailable) {
      throw AppError.slotUnavailable(
        "O horário selecionado não está mais disponível. Escolha outro.",
      );
    }

    const { startTime, endTime } = buildAppointmentTimes(
      input.date,
      input.time,
      totalDuration,
    );

    const preCheckConflicts = await this.repos.appointments.findBlockingInRange(
      input.professionalId,
      startTime.toISOString(),
      endTime.toISOString(),
    );

    if (preCheckConflicts.length > 0) {
      throw AppError.overbooking();
    }

    const normalizedWhatsapp = normalizeWhatsapp(input.customerWhatsapp);
    const { customer, created: customerCreated } =
      await this.repos.customers.upsertByWhatsapp(normalizedWhatsapp, input.customerName);

    const protocol = generateProtocol();

    const appointment = await this.repos.appointments.create(
      {
        protocol,
        customer_id: customer.id,
        professional_id: input.professionalId,
        status: "Agendado",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_duration: totalDuration,
        total_price: totalPrice,
      },
      services.map((service) => ({
        service_id: service.id,
        price_at_booking: service.price,
        duration_at_booking: service.duration,
      })),
    );

    await this.repos.activityLogs.log(
      customerCreated ? "customer_created" : "appointment_created",
      null,
      {
        appointment_id: appointment.id,
        protocol,
        customer_id: customer.id,
        customer_created: customerCreated,
      },
    );

    return { appointment, protocol, customerCreated };
  }

  private mapServicesToCart(services: Service[]) {
    return services.map((s) => ({
      serviceId: s.id,
      name: s.name,
      duration: s.duration,
      price: Number(s.price),
    }));
  }
}
