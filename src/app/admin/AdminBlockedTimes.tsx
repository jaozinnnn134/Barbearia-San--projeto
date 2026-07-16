"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Appointment {
  id: string;
  date?: string;
  service_id?: string;
  price?: number;
  [key: string]: any; // Permite qualquer outra coluna sem quebrar o TypeScript
}

interface Service {
  id: string;
  price: number;
}

export default function AdminBlockedTimes() {
  const supabase = createClient();

  // Estados do Formulário de Bloqueio
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados das Estatísticas
  const [stats, setStats] = useState({
    dailyCount: 0,
    dailyEarnings: 0,
    weeklyCount: 0,
    weeklyEarnings: 0,
  });
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Função para buscar serviços, agendamentos e calcular ganhos reais
  async function fetchStats() {
    setLoadingStats(true);
    setErrorMessage(null);
    try {
      // 1. Busca os serviços cadastrados (usando "*" para evitar erro de colunas)
      const { data: servicesData, error: sError } = await (supabase.from("services") as any)
        .select("*");
      
      const servicesMap: Record<string, number> = {};
      if (servicesData && !sError) {
        servicesData.forEach((s: any) => {
          servicesMap[s.id] = Number(s.price || 0);
        });
      }

      // 2. Busca todos os agendamentos cadastrados (usando "*" para evitar que falhe caso falte alguma coluna)
      const { data: appointments, error: aError } = await (supabase.from("appointments") as any)
        .select("*");

      if (aError) {
        // Guarda a mensagem real do erro para mostrar no painel
        setErrorMessage(`Supabase Error: ${aError.message || JSON.stringify(aError)}`);
        console.error("Erro detalhado do Supabase:", aError);
        return;
      }

      // Se não houver agendamentos ainda, define tudo como zero
      if (!appointments || appointments.length === 0) {
        setStats({ dailyCount: 0, dailyEarnings: 0, weeklyCount: 0, weeklyEarnings: 0 });
        return;
      }

      // Data de hoje local no formato YYYY-MM-DD
      const localToday = new Date();
      const year = localToday.getFullYear();
      const month = String(localToday.getMonth() + 1).padStart(2, "0");
      const day = String(localToday.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      // Gerar array com os últimos 7 dias no formato YYYY-MM-DD
      const last7Days: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(localToday.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dayStr = String(d.getDate()).padStart(2, "0");
        last7Days.push(`${y}-${m}-${dayStr}`);
      }

      let dailyCount = 0;
      let dailyEarnings = 0;
      let weeklyCount = 0;
      let weeklyEarnings = 0;

      appointments.forEach((app: Appointment) => {
        // Tenta encontrar a data do agendamento (verifica "date" ou "scheduled_at" como alternativa)
        const appDateRaw = app.date || app.scheduled_at;
        if (!appDateRaw) return;

        // Limpa fuso horário
        const appDateStr = appDateRaw.split("T")[0];

        // Define o preço real baseado nas colunas existentes
        const appPrice = app.price 
          ? Number(app.price) 
          : (app.service_id && servicesMap[app.service_id]) 
            ? servicesMap[app.service_id] 
            : 35; // valor padrão caso não tenha preço ou serviço mapeado

        // Se o agendamento for hoje
        if (appDateStr === todayStr) {
          dailyCount++;
         dailyEarnings += appPrice ?? 0;
        }

        // Se o agendamento estiver contido na lista dos últimos 7 dias
        if (last7Days.includes(appDateStr)) {
          weeklyCount++;
          weeklyEarnings += appPrice;
        }
      });

      setStats({
        dailyCount,
        dailyEarnings,
        weeklyCount,
        weeklyEarnings,
      });

    } catch (err: any) {
      setErrorMessage(`Erro de Execução: ${err.message || String(err)}`);
      console.error("Erro na execução do fetchStats:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  // Carrega os dados ao abrir a tela
  useEffect(() => {
    fetchStats();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return alert("Por favor, selecione uma data.");

    setLoading(true);
    try {
      const { error } = await (supabase.from("blocked_times") as any).insert([
        {
          date,
          start_time: isAllDay ? null : startTime,
          end_time: isAllDay ? null : endTime,
          is_all_day: isAllDay,
        }
      ]);

      if (error) throw error;

      alert("Bloqueio saved com sucesso!");
      setDate("");
      setStartTime("");
      setEndTime("");
      setIsAllDay(false);
      setDescription("");
      
      fetchStats();
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* SEÇÃO DO DASHBOARD / ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Painel Diário */}
        <div className="p-6 bg-zinc-900 border border-brand-steel-light/35 rounded-lg text-white">
          <h3 className="text-xs uppercase tracking-wider text-brand-bronze font-semibold mb-2">Hoje</h3>
          {loadingStats ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ) : errorMessage ? (
            <p className="text-xs text-red-400">{errorMessage}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.dailyCount} <span className="text-sm font-normal text-zinc-400">agendados</span></p>
              <p className="text-sm text-emerald-400 font-medium">Ganhos estimados: R$ {stats.dailyEarnings.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Painel Semanal */}
        <div className="p-6 bg-zinc-900 border border-brand-steel-light/35 rounded-lg text-white">
          <h3 className="text-xs uppercase tracking-wider text-brand-bronze font-semibold mb-2">Últimos 7 Dias</h3>
          {loadingStats ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ) : errorMessage ? (
            <p className="text-xs text-red-400">{errorMessage}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.weeklyCount} <span className="text-sm font-normal text-zinc-400">agendados</span></p>
              <p className="text-sm text-emerald-400 font-medium">Ganhos estimados: R$ {stats.weeklyEarnings.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* FORMULÁRIO DE BLOQUEIO */}
      <div className="p-6 bg-zinc-900 border border-brand-steel-light/35 rounded-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-brand-bronze uppercase tracking-wider text-sm">Bloquear Horário / Folga</h2>
          <button 
            onClick={fetchStats}
            className="text-xs text-zinc-400 hover:text-white underline"
            title="Atualizar estatísticas"
          >
            Atualizar Dados
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-smoke mb-1">Data:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded bg-zinc-800"
            />
            <label htmlFor="allDay" className="text-sm text-brand-smoke">Bloquear o dia todo</label>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-brand-smoke mb-1">Início:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                  required={!isAllDay}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-brand-smoke mb-1">Fim:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                  required={!isAllDay}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-smoke mb-1">Motivo:</label>
            <input
              type="text"
              placeholder="Ex: Almoço, Folga, Médico..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-brand-bronze text-black hover:bg-yellow-600 font-semibold rounded disabled:opacity-55 transition-colors"
          >
            {loading ? "Salvando..." : "Bloquear Horário"}
          </button>
        </form>
      </div>
    </div>
  );
}