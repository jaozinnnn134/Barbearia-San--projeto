import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRepositories } from "@/lib/repositories";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function mapAppointmentStatusLabel(status?: string | null) {
  const normalized = String(status ?? "").trim().toLowerCase();

  const statusMap: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    completed: "Concluído",
    concluído: "Concluído",
    finalizado: "Concluído",
    agendado: "Pendente",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    "não compareceu": "Não compareceu",
    "nao compareceu": "Não compareceu",
  };

  return statusMap[normalized] ?? status ?? "Pendente";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const ADMIN_PROFESSIONAL_NAME = "Thiago";

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const db = createAdminClient();
  const repos = createRepositories(db);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  end.setDate(end.getDate() + 6);

  const appointments = await repos.appointments.findTodayWithRelations(
    start.toISOString(),
    end.toISOString(),
  );

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Finalizado",
  );

  const estimatedRevenue = completedAppointments.reduce((sum, appointment) => {
    return sum + Number(appointment.services?.price ?? 0);
  }, 0);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">
              Painel administrativo
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-brand-fog">
              Agendamentos de hoje e próximos dias
            </h1>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="industrial-card p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-bronze">Lucro estimado do dia</p>
            <p className="mt-2 text-2xl font-semibold text-brand-fog">{formatCurrency(estimatedRevenue)}</p>
          </div>
          <div className="industrial-card p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-bronze">Agendamentos concluídos</p>
            <p className="mt-2 text-2xl font-semibold text-brand-fog">{completedAppointments.length}</p>
          </div>
          <div className="industrial-card p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-bronze">Total de agendamentos</p>
            <p className="mt-2 text-2xl font-semibold text-brand-fog">{appointments.length}</p>
          </div>
        </div>

        <section className="industrial-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-brand-smoke">
              <thead className="bg-brand-matte text-xs uppercase tracking-[0.25em] text-brand-bronze">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Serviços</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-smoke">
                      Nenhum agendamento para hoje.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-t border-brand-steel-light/30">
                      <td className="px-4 py-3 text-brand-fog">{appointment.client_name}</td>
                      <td className="px-4 py-3">{appointment.client_phone}</td>
                      <td className="px-4 py-3">{ADMIN_PROFESSIONAL_NAME}</td>
                      <td className="px-4 py-3">
                        {formatDateTime(`${appointment.appointment_date}T${appointment.appointment_time}`)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="block">{appointment.services?.name ?? "Serviço"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-bronze">
                        {mapAppointmentStatusLabel(appointment.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
