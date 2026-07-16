import type { SupabaseDatabaseClient } from "@/lib/repositories/base.repository";
import { ServicesRepository } from "@/lib/repositories/services.repository";
import { CustomersRepository } from "@/lib/repositories/customers.repository";
import { AppointmentsRepository } from "@/lib/repositories/appointments.repository";
import {
  ProfilesRepository,
  SettingsRepository,
} from "@/lib/repositories/profiles.repository";
import { SchedulesRepository } from "@/lib/repositories/schedules.repository";
import { ActivityLogsRepository } from "@/lib/repositories/activity-logs.repository";

export interface Repositories {
  services: ServicesRepository;
  customers: CustomersRepository;
  appointments: AppointmentsRepository;
  profiles: ProfilesRepository;
  settings: SettingsRepository;
  schedules: SchedulesRepository;
  activityLogs: ActivityLogsRepository;
}

export function createRepositories(db: SupabaseDatabaseClient): Repositories {
  return {
    services: new ServicesRepository(db),
    customers: new CustomersRepository(db),
    appointments: new AppointmentsRepository(db),
    profiles: new ProfilesRepository(db),
    settings: new SettingsRepository(db),
    schedules: new SchedulesRepository(db),
    activityLogs: new ActivityLogsRepository(db),
  };
}

export {
  ServicesRepository,
  CustomersRepository,
  AppointmentsRepository,
  ProfilesRepository,
  SettingsRepository,
  SchedulesRepository,
  ActivityLogsRepository,
};
