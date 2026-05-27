"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/AppModal";
import { getWeeklyRanking } from "@/services/progressService";
import type { RankingEntry, UserProgress } from "@/types/dailyProgress";

type RankingModalProps = {
  progress: UserProgress;
  onClose: () => void;
};

export function RankingModal({ progress, onClose }: RankingModalProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [source, setSource] = useState<"supabase" | "local">("local");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRanking() {
      setIsLoading(true);
      const result = await getWeeklyRanking(progress);

      if (isMounted) {
        setRanking(result.entries);
        setSource(result.source);
        setIsLoading(false);
      }
    }

    loadRanking();

    return () => {
      isMounted = false;
    };
  }, [progress]);

  return (
    <AppModal title="Ranking da Semana" onClose={onClose}>
      {isLoading ? (
        <div className="rounded-2xl bg-parchment p-5 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-gold/40" />
          <p className="mt-3 font-black text-navy">Atualizando ranking...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="rounded-2xl bg-parchment p-5 text-center">
          <p className="font-black text-navy">Ranking da semana ainda está começando.</p>
          <p className="mt-2 leading-7 text-ink/68">
            Complete os desafios de hoje para aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="px-1 text-xs font-bold uppercase tracking-wide text-ink/50">
            {source === "supabase" ? "Ranking global" : "Ranking local offline"}
          </p>
          {ranking.map((item) => (
            <div
              key={item.name}
              className={`flex animate-[fadeIn_220ms_ease-out] items-center justify-between rounded-2xl px-4 py-3 ${
                item.isCurrentUser ? "bg-gold/20 text-navy ring-1 ring-gold/30" : "bg-parchment text-ink"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-navy shadow-sm">
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
