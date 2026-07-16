import { BaseRepository } from "@/lib/repositories/base.repository";
import type { Customer, TablesInsert, TablesUpdate } from "@/types/database.types";
import { AppError } from "@/lib/errors/app-error";

export class CustomersRepository extends BaseRepository {
  async findByWhatsapp(whatsapp: string): Promise<Customer | null> {
    const { data, error } = await this.db
      .from("customers")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.db
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findAll(): Promise<Customer[]> {
    const { data, error } = await this.db
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async count(): Promise<number> {
    const { count, error } = await this.db
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (error) this.handleError(error);
    return count ?? 0;
  }

  async create(payload: TablesInsert<"customers">): Promise<Customer> {
    const { data, error } = await this.db
      .from("customers")
      .insert(payload)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.internal("Falha ao criar cliente.");
    return data;
  }

  async update(id: string, payload: TablesUpdate<"customers">): Promise<Customer> {
    const { data, error } = await this.db
      .from("customers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    if (!data) throw AppError.notFound("Cliente não encontrado.");
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("customers").delete().eq("id", id);
    if (error) this.handleError(error);
  }

  async upsertByWhatsapp(
    whatsapp: string,
    name: string,
  ): Promise<{ customer: Customer; created: boolean }> {
    const existing = await this.findByWhatsapp(whatsapp);

    if (existing) {
      if (existing.name !== name) {
        const updated = await this.update(existing.id, { name });
        return { customer: updated, created: false };
      }
      return { customer: existing, created: false };
    }

    const created = await this.create({ name, whatsapp });
    return { customer: created, created: true };
  }
}
