"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminBlockedTimes() {
  const supabase = createClient();

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return alert("Por favor, selecione uma data.");

    setLoading(true);
    try {
      // Grava o bloqueio diretamente na tabela 'blocked_times' do Supabase
      const { error } = await supabase.from("blocked_times").insert([
        {
          date,
          start_time: isAllDay ? null : startTime,
          end_time: isAllDay ? null : endTime,
          is_all_day: isAllDay,
          description: description || null,
        },
      ]);

      if (error) throw error;

      alert("Bloqueio salvo com sucesso!");
      setDate("");
      setStartTime("");
      setEndTime("");
      setIsAllDay(false);
      setDescription("");
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-zinc-900 border border-brand-steel-light/35 rounded-lg text-white">
      <h2 className="text-xl font-semibold mb-4 text-brand-bronze uppercase tracking-wider text-sm">Bloquear Horário / Folga</h2>
      
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
  );
}