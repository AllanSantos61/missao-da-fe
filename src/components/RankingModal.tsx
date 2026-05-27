"use client";

import { AppModal } from "@/components/AppModal";
import { getWeeklyRanking } from "@/services/progressService";
import type { UserProgress } from "@/types/dailyProgress";

type RankingModalProps = {
  progress: UserProgress;
  onClose: () => void;
};

export function RankingModal({ progress, onClose }: RankingModalProps) {
  const ranking = getWeeklyRanking(progress);

  return (
    <AppModal title="Ranking da Semana" onClose={onClose}>
      {ranking.length === 0 ? (
        <div className="rounded-2xl bg-parchment p-5 text-center">
          <p className="font-black text-navy">Ranking da semana ainda está começando.</p>
          <p className="mt-2 leading-7 text-ink/68">
            Complete os desafios de hoje para aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-2xl bg-gold/18 px-4 py-3 text-navy"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-navy">
                  {item.rank}
                </span>
                <span className="font-black">{item.isCurrentUser ? `${item.name} (você)` : item.name}</span>
              </div>
              <span className="font-black">{item.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </AppModal>
  );
}
