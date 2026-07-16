import type { Service } from "@/types/database.types";

interface BookingSummaryStepProps {
  services: Service[];
  selectedServices: string[];
  professionalName: string;
  date: string;
  time: string;
  customerName: string;
  customerWhatsapp: string;
  totalDuration: number;
  totalPrice: number;
  onBack: () => void;
}

export function BookingSummaryStep({
  services,
  selectedServices,
  professionalName,
  date,
  time,
  customerName,
  customerWhatsapp,
  totalDuration,
  totalPrice,
  onBack,
}: BookingSummaryStepProps) {
  const chosenServices = services.filter((service) => selectedServices.includes(service.id));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-fog">
          Etapa 4 · Resumo premium
        </h2>
      </div>

      <div className="grid gap-3 text-sm text-brand-smoke">
        <div className="rounded-xl border border-brand-bronze/20 bg-brand-graphite/80 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-smoke">Serviços</p>
          <ul className="mt-3 space-y-2">
            {chosenServices.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-brand-fog"
              >
                <span>{service.name}</span>
                <span>R$ {Number(service.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-brand-bronze/20 bg-brand-graphite/80 p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-smoke">Profissional</p>
              <p className="mt-1 text-brand-fog">{professionalName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-smoke">Data</p>
              <p className="mt-1 text-brand-fog">{date}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-smoke">Hora</p>
              <p className="mt-1 text-brand-fog">{time}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-smoke">Contato</p>
              <p className="mt-1 text-brand-fog">{customerWhatsapp}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-bronze/30 bg-brand-bronze/10 p-4">
          <div className="flex items-center justify-between text-brand-fog">
            <span className="text-sm">Duração total</span>
            <span className="font-semibold">{totalDuration} min</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-brand-fog">
            <span className="text-sm">Valor total</span>
            <span className="text-2xl font-semibold">R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-bronze/15 bg-black/20 p-4 text-brand-fog">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-smoke">Cliente</p>
          <p className="mt-2 font-medium">{customerName}</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-brand-bronze/30 px-4 py-2 text-sm text-brand-fog"
        >
          Voltar
        </button>
      </div>
    </section>
  );
}
