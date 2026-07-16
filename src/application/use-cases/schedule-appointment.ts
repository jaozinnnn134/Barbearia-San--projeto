import type { AppointmentEntity } from "@/domain/entities/appointment";
import type { AppointmentRepository } from "@/domain/repositories/appointment-repository";

export interface ScheduleAppointmentInput {
  protocol: string;
  customerId: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalPrice: number;
  notes?: string | null;
}

export class ScheduleAppointmentUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(input: ScheduleAppointmentInput): Promise<AppointmentEntity> {
    if (!input.protocol.trim()) {
      throw new Error("Protocolo do agendamento é obrigatório.");
    }

    if (!input.customerId.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    if (!input.professionalId.trim()) {
      throw new Error("Profissional é obrigatório.");
    }

    if (!input.startTime.trim() || !input.endTime.trim()) {
      throw new Error("Intervalo de horário é obrigatório.");
    }

    return this.appointmentRepository.create({
      protocol: input.protocol.trim(),
      customerId: input.customerId.trim(),
      professionalId: input.professionalId.trim(),
      status: "Agendado",
      startTime: input.startTime,
      endTime: input.endTime,
      totalDuration: input.totalDuration,
      totalPrice: input.totalPrice,
      notes: input.notes ?? null,
    });
  }
}
