import type { AppointmentEntity } from "@/domain/entities/appointment";
import type { AppointmentRepository } from "@/domain/repositories/appointment-repository";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/supabase-admin";

export class SupabaseAppointmentRepository implements AppointmentRepository {
  async create(
    input: Omit<AppointmentEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<AppointmentEntity> {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        protocol: input.protocol,
        customer_id: input.customerId,
        professional_id: input.professionalId,
        status: input.status,
        start_time: input.startTime,
        end_time: input.endTime,
        total_duration: input.totalDuration,
        total_price: input.totalPrice,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.toEntity(data);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("appointments")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return null;

    return this.toEntity(data);
  }

  async list(): Promise<AppointmentEntity[]> {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.from("appointments").select();

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => this.toEntity(item));
  }

  private toEntity(row: {
    id: string;
    protocol: string;
    customer_id: string;
    professional_id: string;
    status: AppointmentEntity["status"];
    start_time: string;
    end_time: string;
    total_duration: number;
    total_price: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }): AppointmentEntity {
    return {
      id: row.id,
      protocol: row.protocol,
      customerId: row.customer_id,
      professionalId: row.professional_id,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      totalDuration: row.total_duration,
      totalPrice: row.total_price,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
