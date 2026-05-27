type ChallengeActionBarProps = {
  isCompleted: boolean;
  nextMissionLabel: string;
  onBack: () => void;
  onNextMission: () => void;
};

export function ChallengeActionBar({
  isCompleted,
  nextMissionLabel,
  onBack,
  onNextMission
}: ChallengeActionBarProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button onClick={onBack} className="rounded-full bg-parchment px-4 py-3 text-sm font-black text-navy">
        Voltar ao início
      </button>
      {isCompleted ? (
        <button
          onClick={onNextMission}
          className="rounded-full bg-navy px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-ink"
        >
          {nextMissionLabel}
        </button>
      ) : null}
    </div>
  );
}
