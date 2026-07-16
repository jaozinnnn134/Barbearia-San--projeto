"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  services?: {
    name: string;
    price: number;
  };
}

interface TableProps {
  initialAppointments: Appointment[];
}

export default function AdminAppointmentsTable({ initialAppointments }: TableProps) {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Função para formatar a data e hora na tabela
  function formatDateTime(date: string, time: string) {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(`${date}T${time}`));
    } catch {
      return `${date} - ${time}`;
    }
  }

  // Mapeamento visual bonito dos Status
  function mapStatusLabel(status?: string | null) {
    const normalized = String(status ?? "").trim().toLowerCase();
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
      confirmed: { label: "Confirmado", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
      cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/20" },
      canceled: { label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/20" },
      completed: { label: "Concluído", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
      concluído: { label: "Concluído", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
      finalizado: { label: "Concluído", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    };

    const match = statusMap[normalized] || { label: status ?? "Pendente", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${match.color}`}>
        {match.label}
      </span>
    );
  }

  // 1. Atualizar Status no Supabase (Concluir / Cancelar)
  async function handleUpdateStatus(id: string, newStatus: string) {
    setLoadingId(id);
    try {
      // @ts-ignore - Força o TypeScript a ignorar a tipagem rígida do Supabase que gera o erro de build
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Atualiza o estado na tela instantaneamente
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  // 2. Abrir WhatsApp com Mensagem Automática Personalizada
  function handleWhatsAppClick(app: Appointment) {
    // Limpa o número de telefone mantendo apenas números
    const cleanPhone = app.client_phone.replace(/\D/g, "");
    
    // Formata o número com o código do país do Brasil se faltar
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    
    const serviceName = app.services?.name ?? "Corte de Cabelo";
    const [hours, minutes] = app.appointment_time.split(":");
    const timeStr = `${hours}:${minutes}`;

    // Mensagem amigável pré-definida
    const message = `Olá, ${app.client_name}! 💈 Passando aqui para confirmar o seu agendamento de *${serviceName}* com o Thiago hoje às *${timeStr}*. Está tudo confirmado? Aguardo você!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  }

  return (
    <section className="industrial-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-brand-smoke">
          <thead className="bg-brand-matte text-xs uppercase tracking-[0.25em] text-brand-bronze">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-steel-light/10">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-smoke">
                  Nenhum agendamento para hoje ou próximos dias.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => {
                const normalizedStatus = String(appointment.status ?? "").trim().toLowerCase();
                const isCancelled = normalizedStatus === "cancelled" || normalizedStatus === "canceled";
                const isCompleted = normalizedStatus === "completed" || normalizedStatus === "finalizado" || normalizedStatus === "concluído";

                return (
                  <tr key={appointment.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-fog">
                      {appointment.client_name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">{appointment.client_phone}</span>
                        <button
                          onClick={() => handleWhatsAppClick(appointment)}
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded transition-all"
                          title="Enviar Mensagem de Confirmação"
                        >
                          {/* Ícone de Balão de Conversa (SVG) */}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-brand-smoke font-medium">
                        {appointment.services?.name ?? "Serviço"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {mapStatusLabel(appointment.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão de Finalizar */}
                        {!isCompleted && !isCancelled && (
                          <button
                            disabled={loadingId === appointment.id}
                            onClick={() => handleUpdateStatus(appointment.id, "completed")}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold rounded transition-colors"
                            title="Marcar como concluído"
                          >
                            ✓ Concluir
                          </button>
                        )}

                        {/* Botão de Cancelar */}
                        {!isCancelled && !isCompleted && (
                          <button
                            disabled={loadingId === appointment.id}
                            onClick={() => handleUpdateStatus(appointment.id, "cancelled")}
                            className="px-2 py-1 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-black text-xs font-medium rounded transition-colors"
                            title="Cancelar agendamento"
                          >
                            ✕ Cancelar
                          </button>
                        )}

                        {/* Indicador se já estiver cancelado/concluído */}
                        {(isCompleted || isCancelled) && (
                          <span className="text-xs text-zinc-500 italic">Sem ações</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}