import { BaseRepository } from "@/lib/repositories/base.repository";
import type { Service, TablesInsert, TablesUpdate } from "@/types/database.types";
import { AppError } from "@/lib/errors/app-error";

export class ServicesRepository extends BaseRepository {
  async findAllActive(): Promise<Service[]> {
    const { data, error } = await this.db
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findAll(): Promise<Service[]> {
    const { data, error } = await this.db
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findById(id: string): Promise<Service | null> {
    const { data, error } = await this.db
      .from("services")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findByIds(ids: string[]): Promise<Service[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.db
      .from("services")
      .select("*")
      .in("id", ids)
      .eq("active", true);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async create(payload: TablesInsert<"services">): Promise<Service> {
    const { data, error } = await this.db
      .from("services")
      .insert(payload)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.internal("Falha ao criar serviço.");
    return data;
  }

  async update(id: string, payload: TablesUpdate<"services">): Promise<Service> {
    const { data, error } = await this.db
      .from("services")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Serviço não encontrado.");
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("services").delete().eq("id", id);
    if (error) this.handleError(error);
  }
}
