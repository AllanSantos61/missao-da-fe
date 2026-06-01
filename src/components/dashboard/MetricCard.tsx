import type { DashboardMetric } from "@/services/adminDashboardService";

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article className="rounded-[1.25rem] bg-white p-4 shadow-card ring-1 ring-navy/5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">{metric.label}</p>
      <p className="mt-2 text-3xl font-black text-navy">
        {metric.value.toLocaleString("pt-BR")}
        {metric.suffix ? <span className="text-base text-ink/55">{metric.suffix}</span> : null}
      </p>
    </article>
  );
}
