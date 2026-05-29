"use client";

import { useState } from "react";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";

type OnboardingModalProps = {
  onComplete: (playerName?: string) => void;
  onSkip: () => void;
};

const slides = [
  {
    title: "Comece sua Jornada da Fé",
    text: "Leia o Novo Testamento em 365 dias, um trecho por dia."
  },
  {
    title: "Complete sua missão diária",
    text: "Leia, responda o quiz e descubra a Palavra da Fé."
  },
  {
    title: "Acompanhe seu progresso",
    text: "Ganhe XP, mantenha sua sequência e veja sua evolução no calendário."
  }
];

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const isLastSlide = step === slides.length - 1;
  const showNameStep = step === slides.length;
  const slide = slides[step] ?? slides[slides.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-navy/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="w-full rounded-[2rem] bg-white p-6 text-center shadow-soft sm:max-w-md">
        <div className="flex justify-center">
          <MissaoDaFeLogo size="loading" />
        </div>

        {showNameStep ? (
          <>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gold">Seu nome</p>
            <h2 className="mt-2 text-3xl font-black text-navy">Como você quer aparecer?</h2>
            <p className="mt-3 leading-7 text-ink/68">Use apenas um apelido simples para o ranking.</p>
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Seu nome"
              className="mt-5 w-full rounded-2xl border border-navy/12 bg-parchment px-4 py-4 text-center font-black text-navy outline-none focus:ring-4 focus:ring-gold/20"
            />
            <button
              onClick={() => onComplete(playerName)}
              className="mt-4 w-full rounded-2xl bg-navy px-5 py-4 font-black text-white shadow-card"
            >
              Começar Jornada
            </button>
          </>
        ) : (
          <>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gold">Missão da Fé</p>
            <h2 className="mt-2 text-3xl font-black text-navy">{slide.title}</h2>
            <p className="mt-3 min-h-[56px] leading-7 text-ink/68">{slide.text}</p>
            <div className="mt-5 flex justify-center gap-2">
              {slides.map((_, index) => (
                <span
                  key={index}
                  className={`h-2 rounded-full transition-all ${index === step ? "w-8 bg-gold" : "w-2 bg-navy/15"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setStep((current) => current + 1)}
              className="mt-5 w-full rounded-2xl bg-navy px-5 py-4 font-black text-white shadow-card"
            >
              {isLastSlide ? "Definir meu nome" : "Continuar"}
            </button>
          </>
        )}

        <button onClick={onSkip} className="mt-4 text-sm font-black text-navy/55">
          Pular
        </button>
      </section>
    </div>
  );
}
