import type { Profile, TimeSlot } from "@/types/database.types";

interface BookingScheduleStepProps {
  profiles: Profile[];
  professionalId: string;
  date: string;
  time: string;
  availabilitySlots: TimeSlot[];
  isLoadingAvailability: boolean;
  onChange: (field: "professionalId" | "date" | "time", value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function BookingScheduleStep({
  profiles,
  professionalId,
  date,
  time,
  availabilitySlots,
  isLoadingAvailability,
  onChange,
  onBack,
  onNext,
}: BookingScheduleStepProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-fog">
          Etapa 2 · Profissional e horário
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-brand-smoke">
          <span>Profissional</span>
          <select
            value={professionalId}
            onChange={(event) => onChange("professionalId", event.target.value)}
            className="w-full rounded-md border border-brand-bronze/20 bg-brand-graphite px-3 py-2 text-brand-fog outline-none"
          >
            <option value="">Selecione</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-brand-smoke">
          <span>Data</span>
          <input
            type="date"
            value={date}
            onChange={(event) => onChange("date", event.target.value)}
            className="w-full rounded-md border border-brand-bronze/20 bg-brand-graphite px-3 py-2 text-brand-fog outline-none"
          />
        </label>
      </div>

      <div className="rounded-xl border border-brand-bronze/15 bg-brand-graphite/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-fog">Disponibilidade real</p>
          <span className="text-xs text-brand-smoke">
            {isLoadingAvailability ? "Consultando..." : `${availabilitySlots.length} horários`}
          </span>
        </div>

        {availabilitySlots.length === 0 ? (
          <p className="text-sm text-brand-smoke">
            {isLoadingAvailability
              ? "Buscando horários disponíveis..."
              : "Selecione profissional e data para visualizar horários reais."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availabilitySlots.filter((slot) => slot.available).length === 0 ? (
              <p className="text-sm text-brand-smoke">
                Nenhum horário disponível para este dia.
              </p>
            ) : (
              availabilitySlots
                .filter((slot) => slot.available)
                .map((slot) => {
                  const isSelected = time === slot.start;

                  return (
                    <button
                      type="button"
                      key={`${slot.start}-${slot.end}`}
                      onClick={() => onChange("time", slot.start)}
                      aria-pressed={isSelected}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-brand-bronze bg-brand-bronze text-brand-graphite"
                          : "border-brand-bronze/30 bg-brand-graphite text-brand-fog hover:border-brand-bronze"
                      }`}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  );
                })
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-brand-bronze/30 px-4 py-2 text-sm text-brand-fog"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-brand-bronze px-4 py-2 text-sm font-semibold text-brand-graphite"
        >
          Continuar
        </button>
      </div>
    </section>
  );
}
