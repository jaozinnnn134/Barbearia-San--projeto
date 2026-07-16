export type AppointmentStatus =
  | "Agendado"
  | "Confirmado"
  | "Em atendimento"
  | "Finalizado"
  | "Cancelado"
  | "Não compareceu";

export interface AppointmentEntity {
  id: string;
  protocol: string;
  customerId: string;
  professionalId: string;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalPrice: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly protocol: string,
    public readonly customerId: string,
    public readonly professionalId: string,
    public readonly status: AppointmentStatus,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly totalDuration: number,
    public readonly totalPrice: number,
    public readonly notes: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}
}
