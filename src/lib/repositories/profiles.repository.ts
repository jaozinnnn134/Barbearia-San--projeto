import { BaseRepository } from "@/lib/repositories/base.repository";
import type {
  Profile,
  Setting,
  SettingValueMap,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/constants/business-hours";
import { AppError } from "@/lib/errors/app-error";

export class SettingsRepository extends BaseRepository {
  async findByKey<K extends keyof SettingValueMap>(
    key: K,
  ): Promise<SettingValueMap[K] | null> {
    const { data, error } = await this.db
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) this.handleError(error);
    if (!data) return null;
    return data.value as SettingValueMap[K];
  }

  async findAll(): Promise<Setting[]> {
    const { data, error } = await this.db
      .from("settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async upsert<K extends keyof SettingValueMap>(
    key: K,
    value: SettingValueMap[K],
    description?: string,
  ): Promise<void> {
    const payload: TablesInsert<"settings"> = {
      key,
      value: value as Setting["value"],
      description: description ?? null,
    };

    const { error } = await this.db
      .from("settings")
      .upsert(payload, { onConflict: "key" });

    if (error) this.handleError(error);
  }

  async getBusinessHours(): Promise<SettingValueMap["business_hours"]> {
    const config = await this.findByKey("business_hours");
    return config ?? DEFAULT_BUSINESS_HOURS;
  }

  async getHolidays(): Promise<SettingValueMap["holidays"]> {
    const config = await this.findByKey("holidays");
    return config ?? { dates: [] };
  }

  async isSetupCompleted(): Promise<boolean> {
    const setup = await this.findByKey("setup");
    return setup?.completed ?? false;
  }

  async markSetupCompleted(completedBy: string): Promise<void> {
    await this.upsert("setup", {
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: completedBy,
    });
  }

  async update(id: string, payload: TablesUpdate<"settings">): Promise<Setting> {
    const { data, error } = await this.db
      .from("settings")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Configuração não encontrada.");
    return data;
  }
}

export class ProfilesRepository extends BaseRepository {
  async findPrimary(): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("is_primary", true)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findAll(): Promise<Profile[]> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .order("name", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async update(id: string, payload: TablesUpdate<"profiles">): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Profissional não encontrado.");
    return data;
  }

  async create(payload: TablesInsert<"profiles">): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .insert(payload)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.internal("Falha ao criar perfil.");
    return data;
  }
}
