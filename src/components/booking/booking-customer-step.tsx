import { formatWhatsappMask } from "@/lib/services/scheduling.service";

interface BookingCustomerStepProps {
  customerName: string;
  customerWhatsapp: string;
  onChange: (field: "customerName" | "customerWhatsapp", value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function BookingCustomerStep({
  customerName,
  customerWhatsapp,
  onChange,
  onBack,
  onNext,
}: BookingCustomerStepProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-fog">
          Etapa 3 · Dados do cliente
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-brand-smoke">
          <span>Nome</span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => onChange("customerName", event.target.value)}
            className="w-full rounded-md border border-brand-bronze/20 bg-brand-graphite px-3 py-2 text-brand-fog outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-brand-smoke">
          <span>WhatsApp</span>
          <input
            type="text"
            value={customerWhatsapp}
            onChange={(event) =>
              onChange("customerWhatsapp", formatWhatsappMask(event.target.value))
            }
            placeholder="(11) 99999-9999"
            className="w-full rounded-md border border-brand-bronze/20 bg-brand-graphite px-3 py-2 text-brand-fog outline-none"
          />
        </label>
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
          Revisar agendamento
        </button>
      </div>
    </section>
  );
}
