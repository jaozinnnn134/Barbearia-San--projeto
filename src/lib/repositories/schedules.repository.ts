import { BaseRepository } from "@/lib/repositories/base.repository";
import type { Schedule, TablesInsert, TablesUpdate } from "@/types/database.types";
import { AppError } from "@/lib/errors/app-error";

export class SchedulesRepository extends BaseRepository {
  async findByProfile(profileId: string): Promise<Schedule[]> {
    const { data, error } = await this.db
      .from("schedules")
      .select("*")
      .eq("profile_id", profileId)
      .order("day_of_week", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findByProfileAndDate(profileId: string, date: string): Promise<Schedule[]> {
    const { data, error } = await this.db
      .from("schedules")
      .select("*")
      .eq("profile_id", profileId)
      .eq("date_override", date);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findBlockedDates(profileId: string): Promise<Schedule[]> {
    const { data, error } = await this.db
      .from("schedules")
      .select("*")
      .eq("profile_id", profileId)
      .eq("is_blocked", true)
      .not("date_override", "is", null);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async create(payload: TablesInsert<"schedules">): Promise<Schedule> {
    const { data, error } = await this.db
      .from("schedules")
      .insert(payload)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.internal("Falha ao criar horário.");
    return data;
  }

  async update(id: string, payload: TablesUpdate<"schedules">): Promise<Schedule> {
    const { data, error } = await this.db
      .from("schedules")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Horário não encontrado.");
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("schedules").delete().eq("id", id);
    if (error) this.handleError(error);
  }
}
