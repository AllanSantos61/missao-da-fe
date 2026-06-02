"use client";

import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import type { ChallengeId } from "@/types/dailyProgress";

type AppTopBarProps = {
  selectedChallenge: ChallengeId | null;
  playerName: string;
  onHome: () => void;
  onSelectChallenge: (challengeId: ChallengeId) => void;
  onOpenName: () => void;
  onOpenRanking: () => void;
  onOpenCommunity: () => void;
};

export function AppTopBar({
  playerName,
  onHome,
  onOpenName,
  onOpenRanking,
  onOpenCommunity
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
              Ranking
            </button>
            <button
              onClick={onOpenCommunity}
              className="hidden rounded-full border border-navy/15 bg-white px-3 py-2 text-xs font-black text-navy shadow-sm sm:inline"
            >
              Comunidade
            </button>
            <button
              onClick={onOpenName}
              className="rounded-full border border-navy/15 bg-white px-3 py-2 text-xs font-black text-navy shadow-sm"
            >
              {playerName || "Meu nome"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
