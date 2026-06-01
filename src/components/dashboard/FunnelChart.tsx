import type { FunnelStep } from "@/services/adminDashboardService";

type FunnelChartProps = {
  steps: FunnelStep[];
};

export function FunnelChart({ steps }: FunnelChartProps) {
  const maxValue = Math.max(1, ...steps.map((step) => step.value));

  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-card ring-1 ring-navy/5">
      <h2 className="text-lg font-black text-navy">Funil da missão</h2>
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm font-black">
              <span className="text-navy">{index + 1}. {step.label}</span>
              <span className="text-ink/55">{step.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-parchment">
              <div
                className="h-full rounded-full bg-faithGreen"
                style={{ width: `${Math.max(4, (step.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
