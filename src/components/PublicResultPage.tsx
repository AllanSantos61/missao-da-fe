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
  const shareUrl = result
    ? buildWhatsAppShareUrl({
        day: result.journeyDay,
        quizScore: result.quizScore,
        quizTotal: result.quizTotal,
        wordAttempts: result.wordAttempts,
        wordSolved: result.wordSolved,
        streak: result.streak,
        xpToday: result.dailyXp,
        readingDone: result.readingCompleted,
        url: origin,
        publicResultUrl: `${origin}/resultado/${result.shareSlug}`
      })
    : "#";

  return (
    <main className="min-h-screen bg-parchment px-4 py-6 text-ink">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 text-center shadow-card">
        <div className="flex justify-center">
          <MissaoDaFeLogo size="home" />
        </div>
        {isLoading ? (
          <p className="mt-6 font-black text-navy">Carregando resultado...</p>
        ) : !result ? (
          <>
            <h1 className="mt-6 text-2xl font-black text-navy">Resultado não encontrado</h1>
            <p className="mt-2 leading-7 text-ink/70">Essa missão pode ter expirado ou ainda não foi sincronizada.</p>
          </>
        ) : (
          <>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-gold">Resultado público</p>
            <h1 className="mt-2 text-3xl font-black text-navy">{result.playerName}</h1>
            <p className="mt-2 text-sm font-bold text-ink/65">Dia {result.journeyDay}/365 da Jornada da Fé</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">Leitura</p>
                <p className="font-black text-navy">{result.readingCompleted ? "Concluída" : "Pendente"}</p>
              </div>
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">Quiz</p>
                <p className="font-black text-navy">{result.quizScore}/{result.quizTotal}</p>
              </div>
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">Palavra</p>
                <p className="font-black text-navy">{result.wordAttempts || 0}/6</p>
              </div>
              <div className="rounded-2xl bg-parchment p-4">
                <p className="text-xs font-bold text-ink/55">XP</p>
                <p className="font-black text-navy">{result.dailyXp}</p>
              </div>
            </div>
            <p className="mt-5 rounded-2xl bg-gold/15 p-4 font-bold leading-7 text-navy">
              Uma missão por dia. Um passo fiel de cada vez.
            </p>
          </>
        )}
        <div className="mt-6 grid gap-3">
          <Link href="/" className="rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card">
            Começar minha Jornada da Fé
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
