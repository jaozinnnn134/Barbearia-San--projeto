import type { Service } from "@/types/database.types";

interface BookingServicesStepProps {
  services: Service[];
  selectedServices: string[];
  onToggleService: (serviceId: string) => void;
  onNext: () => void;
}

export function BookingServicesStep({
  services,
  selectedServices,
  onToggleService,
  onNext,
}: BookingServicesStepProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-fog">
          Etapa 1 · Serviços
        </h2>
        <span className="text-xs text-brand-smoke">
          {selectedServices.length} selecionado(s)
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {services.map((service) => {
          const checked = selectedServices.includes(service.id);

          return (
            <button
              type="button"
              key={service.id}
              onClick={() => onToggleService(service.id)}
              className={`rounded-xl border p-4 text-left transition ${
                checked
                  ? "border-brand-bronze bg-brand-bronze/10"
                  : "border-brand-bronze/20 bg-brand-graphite/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-fog">{service.name}</p>
                  <p className="mt-1 text-xs text-brand-smoke">
                    {Number(service.duration)} min · R${Number(service.price).toFixed(2)}
                  </p>
                </div>
                <span
                  className={`mt-1 h-4 w-4 rounded-full border ${
                    checked
                      ? "border-brand-bronze bg-brand-bronze"
                      : "border-brand-bronze/40"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
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
