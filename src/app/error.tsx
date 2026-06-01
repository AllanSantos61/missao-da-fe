"use client";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.info("[Missão da Fé] Erro de interface recuperado.", error);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8 text-ink">
      <section className="mx-auto max-w-xl rounded-[1.75rem] bg-white p-6 text-center shadow-card">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Missão da Fé</p>
        <h1 className="mt-2 text-2xl font-black text-navy">Não foi possível abrir esta tela.</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-ink/65">
          Volte para o início e tente continuar sua missão novamente.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button onClick={reset} className="rounded-2xl bg-gold px-5 py-3 font-black text-navy">
            Tentar novamente
          </button>
          <a href="/" className="rounded-2xl bg-navy px-5 py-3 font-black text-white">
            Voltar para início
          </a>
        </div>
      </section>
    </main>
  );
}
