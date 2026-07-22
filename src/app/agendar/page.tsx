"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, Phone, CheckCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
}

interface BlockedTime {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
}

export default function AgendarPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estado para controlar a etapa atual do agendamento (1 = Serviço, 2 = Data/Horário, 3 = Dados)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Controle de datas (Calendário Horizontal)
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

  // Controle de horários e formulário
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Carrega os serviços do Supabase
  useEffect(() => {
    async function loadServices() {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setServices(data);
      }
    }
    loadServices();
  }, []);

  // Gera os próximos 7 dias para o calendário horizontal
  useEffect(() => {
    const tempDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      tempDates.push(d);
    }
    setDates(tempDates);
    if (!selectedDate) {
      const today = new Date();
      if (today.getDay() === 1) { // Evita selecionar segunda por padrão
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        setSelectedDate(tomorrow);
      } else {
        setSelectedDate(today);
      }
    }
  }, [currentWeekStart]);

  // Calcula os horários disponíveis
  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    const safeSelectedDate = selectedDate;
    const safeSelectedService = selectedService;

    async function calculateAvailableTimes() {
      const dayOfWeek = safeSelectedDate.getDay();

      if (dayOfWeek === 1) {
        setAvailableTimes([]);
        return;
      }

      const year = safeSelectedDate.getFullYear();
      const month = String(safeSelectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(safeSelectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const { data: blocks } = await supabase
        .from("blocked_times")
        .select("start_time, end_time, is_all_day")
        .eq("date", dateString);

      const hasAllDayBlock = blocks?.some((b: BlockedTime) => b.is_all_day);
      if (hasAllDayBlock) {
        setAvailableTimes([]);
        return;
      }

      let startHour = 9;
      let endHour = 19;

      if (dayOfWeek === 0) {
        endHour = 12;
      }

      const allSlots: string[] = [];
      const current = new Date(safeSelectedDate);
      current.setHours(startHour, 0, 0, 0);

      const limit = new Date(safeSelectedDate);
      limit.setHours(endHour, 0, 0, 0);

      while (current < limit) {
        const timeString = current.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        allSlots.push(timeString);
        current.setMinutes(current.getMinutes() + 30);
      }

      const { data: appointments } = await supabase
        .from("appointments")
        .select("appointment_time, service:service_id(duration_minutes)")
        .eq("appointment_date", dateString);

      const filteredSlots = allSlots.filter((slot) => {
        const [slotH, slotM] = slot.split(":").map(Number);
        const slotStart = (slotH ?? 0) * 60 + (slotM ?? 0);
        const slotEnd = slotStart + safeSelectedService.duration_minutes;

        if (appointments && appointments.length > 0) {
          for (const app of appointments as Array<{
            appointment_time: string;
            service?: { duration_minutes?: number };
          }>) {
            const [appH, appM] = app.appointment_time.slice(0, 5).split(":").map(Number);
            const appStart = (appH ?? 0) * 60 + (appM ?? 0);
            const appDuration = app.service?.duration_minutes ?? 30;
            const appEnd = appStart + appDuration;

            if (slotStart < appEnd && slotEnd > appStart) {
              return false;
            }
          }
        }

        if (blocks && blocks.length > 0) {
          for (const block of blocks as Array<{
            start_time: string | null;
            end_time: string | null;
            is_all_day: boolean;
          }>) {
            if (block.is_all_day) return false;
            if (block.start_time && block.end_time) {
              const [bStartH, bStartM] = block.start_time.split(":").map(Number);
              const [bEndH, bEndM] = block.end_time.split(":").map(Number);

              const blockStart = (bStartH ?? 0) * 60 + (bStartM ?? 0);
              const blockEnd = (bEndH ?? 0) * 60 + (bEndM ?? 0);

              if (slotStart < blockEnd && slotEnd > blockStart) {
                return false;
              }
            }
          }
        }

        return true;
      });

      setAvailableTimes(filteredSlots);
    }

    calculateAvailableTimes();
  }, [selectedDate, selectedService]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedTime(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;

    setLoading(true);

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const appointmentDate = `${year}-${month}-${day}`;

      const { error } = await (supabase.from("appointments") as any).insert([
        {
          client_name: clientName,
          client_phone: clientPhone,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          service_id: selectedService.id,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      alert("Erro ao realizar agendamento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-brand-graphite px-6 text-center">
        <div className="max-w-md rounded-2xl border border-brand-bronze/20 bg-brand-steel/40 p-8 shadow-2xl backdrop-blur-md">
          <CheckCircle className="mx-auto mb-6 h-16 w-16 text-emerald-500" />
          <h2 className="mb-2 font-display text-2xl font-semibold text-brand-fog">Agendamento Confirmado!</h2>
          <p className="mb-6 text-sm text-brand-smoke">
            Seu horário para <strong>{selectedService?.name}</strong> foi reservado com sucesso para o dia{" "}
            {selectedDate?.toLocaleDateString("pt-BR")} às {selectedTime}.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-full bg-brand-bronze px-6 py-3 text-xs font-semibold uppercase tracking-widest text-brand-graphite transition-all hover:bg-brand-bronze/80"
          >
            Voltar para o Início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-graphite py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-brand-bronze/10 bg-brand-steel/20 p-6 shadow-xl backdrop-blur-md">
        
        {/* Topo com Botão de Voltar */}
        <div className="mb-8 flex flex-col items-center justify-center text-center relative">
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
              className="absolute left-0 top-0 flex items-center gap-1 text-xs text-brand-smoke hover:text-brand-bronze transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}

          <Image
            src="/logo.png"
            alt="Barbearia San Thiago"
            width={150}
            height={150}
            className="h-auto w-[150px] object-contain"
            priority
          />
          <p className="mt-3 text-xs tracking-wider text-brand-bronze/85 uppercase">
            Agende seu horário online
          </p>
        </div>

        {/* 1. SELEÇÃO DE SERVIÇOS (PASSO 1) */}
        {step === 1 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-bronze">
              1. Selecione o Serviço
            </h2>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-bronze/10 bg-brand-steel/30 p-4 transition-all hover:border-brand-bronze/40 hover:bg-brand-bronze/10"
                >
                  <div>
                    <h3 className="font-medium text-sm text-brand-fog uppercase">{service.name}</h3>
                    <div className="mt-1 flex items-center gap-4 text-xs text-brand-smoke">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-brand-bronze" /> {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm text-brand-bronze">
                      R$ {Number(service.price).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. SELEÇÃO DE DATA E HORÁRIO (PASSO 2) */}
        {step === 2 && selectedService && (
          <div>
            {/* Resumo do Serviço Escolhido */}
            <div className="mb-6 rounded-xl border border-brand-bronze/20 bg-brand-bronze/10 p-3 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-smoke">Serviço Selecionado:</p>
                <p className="text-sm font-semibold text-brand-fog uppercase">{selectedService.name}</p>
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="text-xs text-brand-bronze underline"
              >
                Trocar
              </button>
            </div>

            {/* Calendário */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-bronze">
                  2. Selecione a Data
                </h2>
                <div className="flex items-center gap-1 text-brand-smoke">
                  <button onClick={handlePrevWeek} className="p-1 hover:text-brand-bronze">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-xs font-medium">
                    {currentWeekStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </span>
                  <button onClick={handleNextWeek} className="p-1 hover:text-brand-bronze">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-brand-bronze">
                {dates.map((date, idx) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isMonday = date.getDay() === 1;
                  const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "");
                  const dayNum = date.getDate();

                  return (
                    <button
                      key={idx}
                      disabled={isMonday}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      className={`flex min-w-[70px] flex-col items-center justify-center rounded-xl py-3 border transition-all ${
                        isMonday
                          ? "opacity-30 border-dashed border-brand-bronze/10 cursor-not-allowed text-brand-smoke"
                          : isSelected
                          ? "border-brand-bronze bg-brand-bronze text-brand-graphite font-bold"
                          : "border-brand-bronze/15 bg-brand-steel/40 text-brand-fog hover:border-brand-bronze/40"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider">
                        {isMonday ? "FECH" : dayName}
                      </span>
                      <span className="text-lg mt-0.5">{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horários */}
            <div className="mb-8">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-bronze">
                3. Selecione o Horário
              </h2>
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSelectTime(time)}
                      className={`rounded-xl border p-3 text-center text-sm font-semibold transition-all ${
                        selectedTime === time
                          ? "border-brand-bronze bg-brand-bronze text-brand-graphite"
                          : "border-brand-bronze/20 bg-brand-steel/10 text-brand-fog hover:border-brand-bronze/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-brand-smoke">Sem horários disponíveis para este dia.</p>
              )}
            </div>
          </div>
        )}

        {/* 3. CONFIRMAÇÃO DOS DADOS (PASSO 3) */}
        {step === 3 && selectedService && selectedDate && selectedTime && (
          <form onSubmit={handleBooking} className="space-y-6">
            <div className="rounded-xl border border-brand-bronze/20 bg-brand-bronze/10 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-bronze">Resumo da Reserva</h3>
              <p className="text-sm text-brand-fog">
                <strong>Serviço:</strong> {selectedService.name} (R$ {Number(selectedService.price).toFixed(2).replace(".", ",")})
              </p>
              <p className="text-sm text-brand-fog">
                <strong>Data e Horário:</strong> {selectedDate.toLocaleDateString("pt-BR")} às {selectedTime}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-brand-smoke">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-brand-smoke" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="w-full rounded-xl border border-brand-bronze/20 bg-brand-steel/30 py-2.5 pl-10 pr-4 text-sm text-brand-fog placeholder-brand-smoke/50 focus:border-brand-bronze focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-brand-smoke">
                  Seu WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-brand-smoke" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-xl border border-brand-bronze/20 bg-brand-steel/30 py-2.5 pl-10 pr-4 text-sm text-brand-fog placeholder-brand-smoke/50 focus:border-brand-bronze focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-bronze py-3.5 text-xs font-bold uppercase tracking-widest text-brand-graphite transition-all hover:bg-brand-bronze/90 disabled:opacity-50"
            >
              {loading ? "Confirmando..." : "Confirmar Agendamento"}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}