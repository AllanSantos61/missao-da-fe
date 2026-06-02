"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SimpleBarChart } from "@/components/dashboard/SimpleBarChart";
import type { AdminDashboardData } from "@/services/adminDashboardService";

type MetricsResponse = {
  success?: boolean;
  data?: AdminDashboardData;
  error?: string;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/metrics");
        const body = (await response.json()) as MetricsResponse | AdminDashboardData;
        if (!response.ok) throw new Error("Não foi possível carregar métricas.");
        const dashboardData = "data" in body ? body.data ?? null : body;
        setData(dashboardData && "metrics" in dashboardData ? dashboardData : null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar dashboard.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <AdminShell title="Dashboard">
      {isLoading ? (
        <section className="rounded-[1.5rem] bg-white p-8 text-center shadow-card">
          <p className="font-black text-navy">Carregando métricas...</p>
        </section>
      ) : error || !data ? (
        <section className="rounded-[1.5rem] bg-red-50 p-8 text-center shadow-card">
          <p className="font-black text-red-700">{error || "Nenhuma métrica disponível."}</p>
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
