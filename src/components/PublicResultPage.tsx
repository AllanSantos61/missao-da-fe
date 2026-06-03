"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { getPublicResult } from "@/services/publicResultService";
import { trackEvent } from "@/services/analyticsService";
import { buildWhatsAppShareUrl, generateShareMessage } from "@/utils/share";
import { formatDias } from "@/utils/pluralize";
import type { PublicResult } from "@/types/dailyProgress";

type PublicResultPageProps = {
  slug: string;
};

const achievements = [
  { day: 7, label: "Primeira Semana", text: "A constância começou a criar raízes." },
  { day: 30, label: "30 Dias", text: "Sua caminhada já virou hábito." },
  { day: 100, label: "100 Dias", text: "Cem passos firmes na Palavra." },
  { day: 365, label: "Novo Testamento Completo", text: "Uma jornada inteira concluída." }
];

function safeDay(day?: number | null) {
  return Number.isFinite(day) && Number(day) >= 1 ? Math.min(365, Math.round(Number(day))) : 1;
}

function getProgressPercent(day: number) {
  return Math.max(1, Math.min(100, Math.round((safeDay(day) / 365) * 100)));
}

function isMissionCompleted(result: PublicResult) {
  return result.readingCompleted && result.quizScore >= result.quizTotal && result.wordSolved;
}

export function PublicResultPage({ slug }: PublicResultPageProps) {
  const [result, setResult] = useState<PublicResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copied, setCopied] = useState(false);

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
  const day = safeDay(result?.journeyDay);
  const percent = getProgressPercent(day);
  const completed = result ? isMissionCompleted(result) : false;
  const shareUrl = useMemo(() => {
    if (!result) return "#";
    return buildWhatsAppShareUrl({
      playerName: result.playerName,
      currentDay: day,
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
      variant: completed ? "complete" : "partial"
    });
  }, [completed, day, result, resultUrl]);

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard?.writeText(resultUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function shareNative() {
    if (!result) return;
    void trackEvent({
      eventName: "public_result_shared",
      userId: result.userId,
      playerName: result.playerName,
      metadata: { slug, channel: "native" }
    });

    if (navigator.share) {
      await navigator.share({
        title: "Missão da Fé",
        text: generateShareMessage({
          playerName: result.playerName,
          currentDay: day,
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
          variant: completed ? "complete" : "partial"
        })
      }).catch(() => copyLink());
      return;
    }

    await copyLink();
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-5 text-ink">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-card">
        <div className="bg-navy px-5 pb-8 pt-6 text-center text-white sm:px-8">
          <div className="flex justify-center">
            <div className="rounded-[1.75rem] bg-white px-5 py-4 shadow-card">
              <MissaoDaFeLogo size="home" />
            </div>
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-gold">
            Jornada católica de 365 dias
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Leia o Novo Testamento inteiro em apenas 10 minutos por dia.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-6 text-white/78">
            Uma missão simples por dia para fortalecer sua fé com leitura, quiz e Palavra da Fé.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 text-xs font-black sm:text-sm">
            <div className="rounded-2xl bg-white/10 px-2 py-3">📖 Leitura</div>
            <div className="rounded-2xl bg-white/10 px-2 py-3">🧠 Quiz</div>
            <div className="rounded-2xl bg-white/10 px-2 py-3">✝️ Palavra</div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {isLoading ? (
            <div className="rounded-3xl bg-parchment p-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">Carregando</p>
              <h2 className="mt-2 text-2xl font-black text-navy">Buscando resultado...</h2>
            </div>
          ) : !result ? (
            <div className="rounded-3xl bg-parchment p-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">Resultado</p>
              <h2 className="mt-2 text-2xl font-black text-navy">Resultado não encontrado</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-ink/65">
                Essa missão pode ter expirado ou ainda não foi sincronizada.
              </p>
            </div>
          ) : (
            <>
              <section className="rounded-[1.75rem] border border-gold/25 bg-parchment p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">
                  {completed ? "Missão concluída" : "Está na Jornada"}
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-navy">
                  🙏 {result.playerName} {completed ? "concluiu o" : "está no"} Dia {day} de 365
                </h2>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-black text-ink/60">
                  <span>{day} / 365 dias</span>
                  <span>{percent}%</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Sequência" value={`🔥 ${formatDias(result.streak)}`} />
                  <Metric label="XP" value={`⭐ ${result.totalXP}`} />
                  <Metric label="Quiz" value={`🧠 ${result.quizScore}/${result.quizTotal}`} />
                  <Metric label="Palavra" value={`✝️ ${result.wordAttempts || 0}/6`} />
                </div>
              </section>

              <section className="mt-5">
                <h3 className="text-lg font-black text-navy">Conquistas da caminhada</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {achievements.map((achievement) => {
                    const unlocked = day >= achievement.day;
                    return (
                      <div
                        key={achievement.day}
                        className={`rounded-2xl border p-4 ${
                          unlocked ? "border-gold/50 bg-gold/15" : "border-ink/10 bg-white text-ink/55"
                        }`}
                      >
                        <p className="font-black text-navy">
                          {unlocked ? "🏅" : "○"} {achievement.label}
                        </p>
                        <p className="mt-1 text-sm font-bold leading-5">{achievement.text}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-5 rounded-[1.75rem] bg-navy p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">Comunidade da Fé</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Proof value="🙏 1.248" label="participantes" />
                  <Proof value="📖 18.430" label="leituras concluídas" />
                  <Proof value="🔥 92.000" label="XP gerados" />
                </div>
              </section>

              <section className="mt-5 grid gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl bg-gold px-5 py-4 text-center font-black text-navy shadow-card transition hover:-translate-y-0.5"
                >
                  🙏 Começar minha Jornada de 365 Dias
                </Link>
                <button
                  type="button"
                  onClick={() => setShowHowItWorks(true)}
                  className="rounded-2xl border border-navy/15 bg-white px-5 py-4 font-black text-navy"
                >
                  📖 Ver como funciona
                </button>
                <div className="grid gap-3 sm:grid-cols-3">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      void trackEvent({
                        eventName: "public_result_shared",
                        userId: result.userId,
                        playerName: result.playerName,
                        metadata: { slug, channel: "whatsapp" }
                      })
                    }
                    className="rounded-2xl bg-faithGreen px-4 py-3 text-center font-black text-white"
                  >
                    Compartilhar no WhatsApp
                  </a>
                  <button type="button" onClick={copyLink} className="rounded-2xl bg-parchment px-4 py-3 font-black text-navy">
                    {copied ? "Link copiado" : "Copiar link"}
                  </button>
                  <button type="button" onClick={() => void shareNative()} className="rounded-2xl bg-parchment px-4 py-3 font-black text-navy">
                    Compartilhar resultado
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </section>

      {showHowItWorks ? (
        <div className="fixed inset-0 z-50 flex items-end bg-navy/60 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-[1.75rem] bg-white p-5 shadow-card">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">Como funciona</p>
            <h2 className="mt-2 text-2xl font-black text-navy">Uma missão por dia</h2>
            <div className="mt-4 grid gap-3 text-sm font-bold text-ink/72">
              {["Leia", "Responda", "Descubra a Palavra", "Ganhe XP", "Complete 365 dias"].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-parchment p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-black text-navy">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setShowHowItWorks(false)} className="mt-5 w-full rounded-2xl bg-navy px-5 py-4 font-black text-white">
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-1 text-sm font-black text-navy">{value}</p>
    </div>
  );
}

function Proof({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/70">{label}</p>
    </div>
  );
}
