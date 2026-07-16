import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRepositories } from "@/lib/repositories";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import AdminBlockedTimes from "./AdminBlockedTimes"; 
import AdminAppointmentsTable from "./AdminAppointmentsTable"; // Importamos o novo componente cliente

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
  };

  return statusMap[normalized] ?? status ?? "Pendente";
}

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const db = createAdminClient();
  const repos = createRepositories(db);
  const today = new Date();
  
  // Define o início de hoje (00:00:00) e o final de hoje (23:59:59) locais
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  // Mantemos a busca para hoje e os próximos 6 dias
  const endForFetch = new Date(end);
  endForFetch.setDate(endForFetch.getDate() + 6);

  const appointments = await repos.appointments.findTodayWithRelations(
    start.toISOString(),
    endForFetch.toISOString(),
  );

  // Formato YYYY-MM-DD de hoje local para filtrarmos corretamente na tela o faturamento do dia
  const todayStr = today.getFullYear() + "-" + 
    String(today.getMonth() + 1).padStart(2, "0") + "-" + 
    String(today.getDate()).padStart(2, "0");

  // Filtra apenas os agendamentos que caem estritamente no dia de hoje
  const todayAppointments = appointments.filter((app) => {
    if (!app.appointment_date) return false;
    return app.appointment_date === todayStr;
  });

  // 1. Agendamentos Concluídos (qualquer status que mapeie para Concluído)
  const completedAppointments = todayAppointments.filter((app) => {
    const label = mapAppointmentStatusLabel(app.status);
    return label === "Concluído";
  });

  // 2. Lucro estimado do dia (soma tudo o que está Pendente ou Concluído hoje - ignora Cancelados)
  const estimatedRevenue = todayAppointments
    .filter((app) => {
      const label = mapAppointmentStatusLabel(app.status);
      return label !== "Cancelado" && label !== "Não compareceu";
    })
    .reduce((sum, app) => {
      return sum + Number(app.services?.price ?? 35); // assume 35 como fallback padrão
    }, 0);

  return (
    <main className="min-h-screen px-4 py-10 bg-black text-white">
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

        {/* SEÇÃO: Bloqueio de Agenda ao lado da Nova Tabela Inteligente */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            {/* Renderiza o componente cliente passando a lista inicial de agendamentos buscada no servidor */}
            <AdminAppointmentsTable initialAppointments={appointments as any} />
          </div>

          <div>
            {/* O formulário do bloqueio renderizado no menu lateral direito do Admin */}
            <AdminBlockedTimes />
          </div>
        </div>
      </div>
    </main>
  );
}