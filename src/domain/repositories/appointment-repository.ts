import type { AppointmentEntity } from "@/domain/entities/appointment";

export interface AppointmentRepository {
  create(
    input: Omit<AppointmentEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<AppointmentEntity>;
  findById(id: string): Promise<AppointmentEntity | null>;
  list(): Promise<AppointmentEntity[]>;
}
