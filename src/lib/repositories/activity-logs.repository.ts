import { BaseRepository } from "@/lib/repositories/base.repository";
import type { ActivityLog, ActivityLogAction, TablesInsert } from "@/types/database.types";
import { AppError } from "@/lib/errors/app-error";

export class ActivityLogsRepository extends BaseRepository {
  async create(payload: TablesInsert<"activity_logs">): Promise<ActivityLog> {
    const { data, error } = await this.db
      .from("activity_logs")
      .insert(payload)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.internal("Falha ao registrar log de auditoria.");
    return data;
  }

  async log(
    action: ActivityLogAction,
    performedBy: string | null,
    details: Record<string, unknown> = {},
  ): Promise<ActivityLog> {
    return this.create({
      action,
      performed_by: performedBy,
      details: details as never,
    });
  }

  async findRecent(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await this.db
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) this.handleError(error);
    return data ?? [];
  }
}
