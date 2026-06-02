"use client";

import { useEffect } from "react";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[App] Error boundary captured", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8 text-ink">
      <section className="mx-auto max-w-md rounded-[1.75rem] bg-white p-6 text-center shadow-card">
        <div className="flex justify-center">
          <MissaoDaFeLogo size="loading" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gold">Missão da Fé</p>
        <h1 className="mt-2 text-2xl font-black text-navy">Sua missão continua.</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-ink/65">
          Tivemos uma instabilidade ao carregar a página, mas seu progresso local permanece seguro.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 w-full rounded-2xl bg-navy px-5 py-4 font-black text-white"
        >
          Tentar novamente
        </button>
        <a href="/" className="mt-3 block rounded-2xl bg-gold px-5 py-4 font-black text-navy">
          Voltar para a Home
        </a>
      </section>
    </main>
  );
}
