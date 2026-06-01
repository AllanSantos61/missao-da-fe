"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SimpleBarChart } from "@/components/dashboard/SimpleBarChart";
import type { AdminDashboardData } from "@/services/adminDashboardService";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/metrics");
      if (response.ok) setData(await response.json());
      setIsLoading(false);
    }
    void load();
  }, []);

  return (
    <AdminShell title="Dashboard">
      {isLoading || !data ? (
        <section className="rounded-[1.5rem] bg-white p-8 text-center shadow-card">
          <p className="font-black text-navy">Carregando métricas...</p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <SimpleBarChart title="Usuários por dia" points={data.usersByDay} />
            <SimpleBarChart title="Missões concluídas por dia" points={data.missionsByDay} />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <SimpleBarChart title="Distribuição por dia da jornada" points={data.journeyDistribution} />
            <FunnelChart steps={data.funnel} />
          </section>
        </>
      )}
    </AdminShell>
  );
}
