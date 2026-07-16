"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import type { Profile, Service, TimeSlot } from "@/types/database.types";
import {
  getBookingAvailabilityAction,
  submitBookingFormAction,
} from "@/lib/actions/booking.actions";
import type { ActionResult } from "@/lib/types/actions";
import type { BookingResult } from "@/lib/services/booking.service";
import { BookingServicesStep } from "@/components/booking/booking-services-step";
import { BookingScheduleStep } from "@/components/booking/booking-schedule-step";
import { BookingCustomerStep } from "@/components/booking/booking-customer-step";
import { BookingSummaryStep } from "@/components/booking/booking-summary-step";

interface BookingFormProps {
  services: Service[];
  profiles: Profile[];
}

const initialState: ActionResult<BookingResult> | null = null;

type BookingStep = "services" | "schedule" | "customer" | "summary";

export function BookingForm({ services, profiles }: BookingFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<BookingStep>("services");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([]);
  const [isAvailabilityPending, startAvailabilityTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(
    submitBookingFormAction,
    initialState,
  );

  const totalDuration = useMemo(
    () =>
      services
        .filter((service) => selectedServices.includes(service.id))
        .reduce((sum, service) => sum + Number(service.duration), 0),
    [services, selectedServices],
  );

  const totalPrice = useMemo(
    () =>
      services
        .filter((service) => selectedServices.includes(service.id))
        .reduce((sum, service) => sum + Number(service.price), 0),
    [services, selectedServices],
  );

  const professionalName =
    profiles.find((profile) => profile.id === professionalId)?.name ?? "Não selecionado";

  useEffect(() => {
    setTime("");
  }, [date, professionalId]);

  useEffect(() => {
    if (!professionalId || !date || totalDuration <= 0) {
      setAvailabilitySlots([]);
      return;
    }

    startAvailabilityTransition(async () => {
      const result = await getBookingAvailabilityAction({
        professionalId,
        date,
        totalDuration,
      });

      if (result.success) {
        setAvailabilitySlots(result.data);
      } else {
        setAvailabilitySlots([]);
      }
    });
  }, [date, professionalId, totalDuration]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  };

  const validateStep = (step: BookingStep) => {
    if (step === "services" && selectedServices.length === 0) {
      return "Selecione pelo menos um serviço.";
    }

    if (step === "schedule") {
      if (!professionalId) return "Selecione um profissional.";
      if (!date) return "Selecione uma data.";
      if (!time) return "Selecione um horário.";
    }

    if (step === "customer") {
      if (!customerName.trim()) return "Informe o nome do cliente.";
      if (!customerWhatsapp.trim()) return "Informe o WhatsApp do cliente.";
    }

    return null;
  };

  const goToNextStep = (step: BookingStep) => {
    const error = validateStep(step);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage(null);

    if (step === "services") setCurrentStep("schedule");
    if (step === "schedule") setCurrentStep("customer");
    if (step === "customer") setCurrentStep("summary");
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-brand-bronze/20 bg-brand-graphite/80 p-6 shadow-2xl shadow-black/20 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-bronze">
          Fluxo de agendamento
        </p>
        <h1 className="font-display text-3xl text-brand-fog">
          Agende seu horário
        </h1>
        <p className="text-sm text-brand-smoke">
          Siga as etapas de forma guiada e confirme o agendamento no final.
        </p>
      </div>

      <form action={formAction} className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-brand-bronze/30 bg-brand-bronze/10 px-4 py-3 text-sm text-brand-fog">
              {errorMessage}
            </div>
          )}

          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-smoke">
            <span className={currentStep === "services" ? "text-brand-bronze" : "text-brand-smoke"}>Serviços</span>
            <span>›</span>
            <span className={currentStep === "schedule" ? "text-brand-bronze" : "text-brand-smoke"}>Horário</span>
            <span>›</span>
            <span className={currentStep === "customer" ? "text-brand-bronze" : "text-brand-smoke"}>Cliente</span>
            <span>›</span>
            <span className={currentStep === "summary" ? "text-brand-bronze" : "text-brand-smoke"}>Resumo</span>
          </div>

          <div className="rounded-xl border border-brand-bronze/15 bg-black/20 p-4">
            {currentStep === "services" && (
              <BookingServicesStep
                services={services}
                selectedServices={selectedServices}
                onToggleService={toggleService}
                onNext={() => goToNextStep("services")}
              />
            )}

            {currentStep === "schedule" && (
              <BookingScheduleStep
                profiles={profiles}
                professionalId={professionalId}
                date={date}
                time={time}
                availabilitySlots={availabilitySlots}
                isLoadingAvailability={isAvailabilityPending}
                onChange={(field, value) => {
                  if (field === "professionalId") setProfessionalId(value);
                  if (field === "date") setDate(value);
                  if (field === "time") setTime(value);
                }}
                onBack={() => setCurrentStep("services")}
                onNext={() => goToNextStep("schedule")}
              />
            )}

            {currentStep === "customer" && (
              <BookingCustomerStep
                customerName={customerName}
                customerWhatsapp={customerWhatsapp}
                onChange={(field, value) => {
                  if (field === "customerName") setCustomerName(value);
                  if (field === "customerWhatsapp") setCustomerWhatsapp(value);
                }}
                onBack={() => setCurrentStep("schedule")}
                onNext={() => goToNextStep("customer")}
              />
            )}

            {currentStep === "summary" && (
              <BookingSummaryStep
                services={services}
                selectedServices={selectedServices}
                professionalName={professionalName}
                date={date}
                time={time}
                customerName={customerName}
                customerWhatsapp={customerWhatsapp}
                totalDuration={totalDuration}
                totalPrice={totalPrice}
                onBack={() => setCurrentStep("customer")}
              />
            )}
          </div>

          {selectedServices.map((serviceId) => (
            <input key={serviceId} type="hidden" name="serviceIds" value={serviceId} />
          ))}
          <input type="hidden" name="professionalId" value={professionalId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="customerName" value={customerName} />
          <input type="hidden" name="customerWhatsapp" value={customerWhatsapp} />
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-brand-bronze/15 bg-black/20 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-fog">
            Resumo
          </h2>

          <div className="space-y-3 text-sm text-brand-smoke">
            <div className="rounded-lg border border-brand-bronze/20 bg-brand-graphite/75 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-smoke">
                Serviços escolhidos
              </p>
              <ul className="mt-2 space-y-1 text-brand-fog">
                {services
                  .filter((service) => selectedServices.includes(service.id))
                  .map((service) => (
                    <li key={service.id} className="flex items-center justify-between gap-3">
                      <span>{service.name}</span>
                      <span>R$ {Number(service.price).toFixed(2)}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <span>Duração</span>
              <span>{totalDuration} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Preço</span>
              <span>R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-brand-bronze/30 bg-brand-bronze/10 p-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-brand-smoke">
              Total estimado
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-fog">
              R$ {totalPrice.toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || currentStep !== "summary"}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-bronze px-4 py-3 text-sm font-semibold text-brand-graphite transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Agendando..." : "Confirmar agendamento"}
          </button>

          {state && (
            <div className="rounded-lg border border-brand-bronze/20 bg-brand-graphite/80 p-3 text-sm">
              {state.success ? (
                <div className="space-y-2 text-brand-fog">
                  <p className="font-semibold text-brand-bronze">Agendamento realizado</p>
                  <p>Protocolo: {state.data.protocol}</p>
                </div>
              ) : (
                <p className="text-red-300">{state.error}</p>
              )}
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
