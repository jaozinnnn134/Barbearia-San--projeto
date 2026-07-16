"use client";

import { Scissors } from "lucide-react";
import { BRAND } from "@/lib/constants/brand";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-industrial-gradient opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-grain-texture" />

      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-brand-bronze/30 bg-brand-steel/70 shadow-bronze">
          <Scissors className="h-6 w-6 text-brand-bronze" strokeWidth={1.5} />
        </div>

        <h1 className="mb-3 font-display text-3xl font-light tracking-tight text-brand-fog sm:text-4xl">
          {BRAND.name}
        </h1>

        <p className="mb-8 max-w-sm text-sm leading-relaxed text-brand-smoke">
          {BRAND.tagline}
        </p>

        <a
          href="/agendar"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-brand-bronze/40 bg-brand-bronze/10 px-7 py-3 text-xs font-medium uppercase tracking-[0.28em] text-brand-bronze transition-all duration-300 hover:border-brand-bronze hover:bg-brand-bronze hover:text-brand-graphite"
        >
          Agendar Horário
        </a>
      </div>
    </main>
  );
}