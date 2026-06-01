"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { getPublicResult } from "@/services/publicResultService";
import { trackEvent } from "@/services/analyticsService";
import { buildWhatsAppShareUrl } from "@/utils/share";
import type { PublicResult } from "@/types/dailyProgress";

type PublicResultPageProps = {
  slug: string;
};

function safeDay(day: number) {
  return Number.isFinite(day) && day >= 1 ? Math.min(365, Math.round(day)) : 1;
}

export function PublicResultPage({ slug }: PublicResultPageProps) {
  const [result, setResult] = useState<PublicResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadResult() {
      const nextResult = await getPublicResult(slug);
      if (!isMounted) return;
      setResult(nextResult);
      setIsLoading(false);
      void trackEvent({
        eventName: "public_result_opened",
        userId: nextResult?.userId,
        playerName: nextResult?.playerName,
        metadata: { slug }
      });
    }

    void loadResult();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const origin = typeof window === "undefined" ? "https://missao-da-fe.vercel.app" : window.location.origin;
  const resultUrl = result ? `${origin}/resultado/${result.shareSlug}` : origin;
  const shareUrl = result
    ? buildWhatsAppShareUrl({
        currentDay: safeDay(result.journeyDay),
        quizScore: result.quizScore,
        quizTotal: result.quizTotal,
        wordScore: result.wordAttempts,
        wordAttempts: result.wordAttempts,
        wordSolved: result.wordSolved,
        streak: result.streak,
        xpToday: result.dailyXp,
        totalXP: result.totalXP,
        readingDone: result.readingCompleted,
        resultUrl,
        variant: "complete"
      })
    : "#";

  return (
    <main className="min-h-screen bg-parchment px-4 py-6 text-ink">
      <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] bg-white text-center shadow-card">
        <div className="bg-navy px-6 pb-8 pt-7 text-white">
          <div className="flex justify-center">
            <MissaoDaFeLogo size="home" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-gold">Resultado compartilhado</p>
          {isLoading ? (
            <h1 className="mt-3 text-2xl font-black">Carregando resultado...</h1>
          ) : !result ? (
            <>
              <h1 className="mt-3 text-2xl font-black">Resultado não encontrado</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-white/72">
                Essa missão pode ter expirado ou ainda não foi sincronizada.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-3xl font-black leading-tight">
                {result.playerName} concluiu a Missão da Fé 🙏
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-white/72">
                Dia {safeDay(result.journeyDay)} de 365 da Jornada da Fé
              </p>
            </>
          )}
        </div>

        {result ? (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">📖 Leitura</p>
                <p className="mt-1 font-black text-navy">{result.readingCompleted ? "Concluída" : "Pendente"}</p>
              </div>
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">🧠 Quiz</p>
                <p className="mt-1 font-black text-navy">{result.quizScore}/{result.quizTotal}</p>
              </div>
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">✝️ Palavra</p>
                <p className="mt-1 font-black text-navy">{result.wordAttempts || 0}/6</p>
              </div>
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">⭐ XP</p>
                <p className="mt-1 font-black text-navy">{result.dailyXp}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-gold/15 p-5 text-left">
              <p className="text-lg font-black leading-7 text-navy">
                Leia o Novo Testamento em 365 dias, com uma missão simples por dia.
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/68">
                Em poucos minutos: leitura bíblica, quiz e Palavra da Fé. Um jeito leve de criar constância.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 px-5 pb-6">
          <Link href="/" className="rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card">
            Começar minha jornada
          </Link>
          {result ? (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                void trackEvent({
                  eventName: "public_result_shared",
                  userId: result.userId,
                  playerName: result.playerName,
                  metadata: { slug }
                })
              }
              className="rounded-2xl bg-faithGreen px-5 py-4 font-black text-white shadow-card"
            >
              Compartilhar no WhatsApp
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
