"use client";

import type { ChallengeId } from "@/types/dailyProgress";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";

type AppTopBarProps = {
  selectedChallenge: ChallengeId | null;
  playerName: string;
  onHome: () => void;
  onSelectChallenge: (challengeId: ChallengeId) => void;
  onOpenName: () => void;
  onOpenRanking: () => void;
};

const navItems: Array<{ id: ChallengeId; label: string }> = [
  { id: "gospel", label: "Evangelho" },
  { id: "quiz", label: "Quiz" },
  { id: "word", label: "Palavra" }
];

export function AppTopBar({
  selectedChallenge,
  playerName,
  onHome,
  onSelectChallenge,
  onOpenName,
  onOpenRanking
}: AppTopBarProps) {
  return (
    <div className="sticky top-0 z-40 -mx-4 border-b border-navy/10 bg-parchment/94 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onHome}
            className="shrink-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-gold/30"
          >
            <MissaoDaFeLogo size="header" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={onOpenRanking}
              className="rounded-full bg-gold px-3 py-2 text-xs font-black text-ink shadow-sm"
            >
              <span className="sm:hidden">Ranking</span>
              <span className="hidden sm:inline">Ranking da Semana</span>
            </button>
            <button
              onClick={onOpenName}
              className="rounded-full border border-navy/15 bg-white px-3 py-2 text-xs font-black text-navy shadow-sm"
            >
              {playerName ? `Jogador: ${playerName}` : "Meu nome"}
            </button>
          </div>
        </div>

        <nav className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectChallenge(item.id)}
              className={`rounded-xl px-2 py-2 text-sm font-black transition ${
                selectedChallenge === item.id ? "bg-navy text-white" : "text-navy/72 hover:bg-parchment"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
