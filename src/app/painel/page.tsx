"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminAppointmentsTable from "./AdminAppointmentsTable";
import AdminBlockedTimes from "./AdminBlockedTimes";

export default function PainelPage() {
  const supabase = createClient();
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);

      // Data de hoje formatada (YYYY-MM-DD)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // 1. Busca os agendamentos trazendo o serviço associado via service_id
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id,
          client_name,
          client_phone,
          appointment_date,
          appointment_time,
          status,
          service:service_id(name, price)
        `)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (!appointmentsError && appointmentsData) {
        setAppointments(appointmentsData);

        // 2. Calcula o total do dia
        const total = appointmentsData
          .filter(
            (item: any) =>
              item.appointment_date === dateString && item.status !== "cancelled"
          )
          .reduce((acc: number, item: any) => {
            const price = item.service?.price ? Number(item.service.price) : 0;
            return acc + price;
          }, 0);

        setTodayTotal(total);
      }

      setLoading(false);
    }

    loadDashboardData();
  }, []);

  return (
    <main className="min-h-screen bg-brand-graphite p-4 sm:p-8 text-brand-fog">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Cabeçalho */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-bronze">
            Painel Administrativo
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            Agendamentos de hoje e próximos dias
          </h1>
        </div>

        {/* Card de Lucro do Dia */}
        <div className="rounded-2xl border border-brand-bronze/10 bg-brand-steel/30 p-6 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-smoke">
            Lucro Estimado do Dia
          </p>
          <p className="mt-2 text-3xl font-bold text-brand-bronze sm:text-4xl">
            R$ {todayTotal.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Tabelas de Gestão */}
        <div className="space-y-8">
          {loading ? (
            <div className="p-8 text-center text-brand-smoke bg-brand-steel/10 rounded-xl border border-brand-bronze/20">
              Carregando agendamentos...
            </div>
          ) : (
            <AdminAppointmentsTable initialAppointments={appointments} />
          )}

          <AdminBlockedTimes />
        </div>
      </div>
    </main>
  );
}