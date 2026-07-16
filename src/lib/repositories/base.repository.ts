import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { AppError } from "@/lib/errors/app-error";

export type SupabaseDatabaseClient = SupabaseClient<Database>;

export abstract class BaseRepository {
  protected readonly db: SupabaseDatabaseClient;

  constructor(db: SupabaseDatabaseClient) {
    this.db = db;
  }

  protected handleError(error: { message: string; code?: string; details?: string }): never {
    if (error.code === "23P01") {
      throw AppError.overbooking(
        "Este horário acabou de ser reservado. Escolha outro horário.",
      );
    }
    if (error.code === "23505") {
      throw AppError.conflict("Registro duplicado detectado.");
    }
    throw AppError.internal(error.message);
  }
}
