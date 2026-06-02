import type { ChartPoint } from "@/services/adminDashboardService";
import { formatDias } from "@/utils/pluralize";

type SimpleBarChartProps = {
  title: string;
  points: ChartPoint[];
  emptyLabel?: string;
};

export function SimpleBarChart({ title, points, emptyLabel = "Sem dados suficientes." }: SimpleBarChartProps) {
  const maxValue = Math.max(1, ...points.map((point) => point.value));

  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-card ring-1 ring-navy/5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-navy">{title}</h2>
        <span className="rounded-full bg-parchment px-3 py-1 text-xs font-black text-navy">{formatDias(points.length)}</span>
      </div>
      {points.every((point) => point.value === 0) ? (
        <p className="mt-5 rounded-2xl bg-parchment p-4 text-sm font-bold text-ink/60">{emptyLabel}</p>
      ) : (
        <div className="mt-5 flex h-44 items-end gap-2">
          {points.map((point) => (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-full bg-parchment">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-navy to-gold"
                  style={{ height: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
                  title={`${point.label}: ${point.value}`}
                />
              </div>
              <span className="truncate text-[10px] font-bold text-ink/55">{point.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
