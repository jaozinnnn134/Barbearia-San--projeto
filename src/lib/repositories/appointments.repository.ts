import { BaseRepository } from "@/lib/repositories/base.repository";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentWithRelations,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";
import { AppError } from "@/lib/errors/app-error";
import { BLOCKING_APPOINTMENT_STATUSES } from "@/lib/constants/business-hours";

export class AppointmentsRepository extends BaseRepository {
  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findByProtocol(protocol: string): Promise<AppointmentWithRelations | null> {
    const { data, error } = await this.db
      .from("appointments")
      .select(
        `
        *,
        services!service_id(*)
      `,
      )
      .eq("protocol", protocol)
      .maybeSingle();

    if (error) this.handleError(error);
    return data as AppointmentWithRelations | null;
  }

  async findByProfessionalAndDateRange(
    professionalId: string,
    startIso: string,
    endIso: string,
  ): Promise<Appointment[]> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*")
      .eq("professional_id", professionalId)
      .in("status", [...BLOCKING_APPOINTMENT_STATUSES])
      .gte("start_time", startIso)
      .lt("start_time", endIso)
      .order("start_time", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findBlockingInRange(
    professionalId: string,
    startIso: string,
    endIso: string,
    excludeId?: string,
  ): Promise<Appointment[]> {
    let query = this.db
      .from("appointments")
      .select("*")
      .eq("professional_id", professionalId)
      .in("status", [...BLOCKING_APPOINTMENT_STATUSES])
      .lt("start_time", endIso)
      .gt("end_time", startIso);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findTodayByProfessional(professionalId: string, dayStart: string, dayEnd: string): Promise<Appointment[]> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*")
      .eq("professional_id", professionalId)
      .gte("start_time", dayStart)
      .lt("start_time", dayEnd)
      .not("status", "in", '("Cancelado","Não compareceu")')
      .order("start_time", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findTodayWithRelations(dayStart: string, dayEnd: string): Promise<any[]> {
    const startDate = dayStart.slice(0, 10);
    const endDate = dayEnd.slice(0, 10);

    const { data, error } = await this.db
      .from("appointments")
      .select(
        `
        id,
        client_name,
        client_phone,
        service_id,
        appointment_date,
        appointment_time,
        status,
        services!service_id(id, name, price, duration_minutes)
      `,
      )
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async create(
    appointment: TablesInsert<"appointments">,
    services: Array<{
      service_id: string;
      price_at_booking: number;
      duration_at_booking: number;
    }>,
  ): Promise<Appointment> {
    const { data: created, error: appointmentError } = await this.db
      .from("appointments")
      .insert(appointment)
      .select()
      .single();

    if (appointmentError) this.handleError(appointmentError);
    if (!created) throw AppError.internal("Falha ao criar agendamento.");

    const appointmentServices = services.map((s) => ({
      appointment_id: created.id,
      ...s,
    }));

    const { error: servicesError } = await this.db
      .from("appointment_services")
      .insert(appointmentServices);

    if (servicesError) {
      await this.db.from("appointments").delete().eq("id", created.id);
      this.handleError(servicesError);
    }

    return created;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const { data, error } = await this.db
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Agendamento não encontrado.");
    return data;
  }

  async update(id: string, payload: TablesUpdate<"appointments">): Promise<Appointment> {
    const { data, error } = await this.db
      .from("appointments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Agendamento não encontrado.");
    return data;
  }

  async countPending(): Promise<number> {
    const { count, error } = await this.db
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .in("status", ["Agendado", "Confirmado"]);

    if (error) this.handleError(error);
    return count ?? 0;
  }
}
