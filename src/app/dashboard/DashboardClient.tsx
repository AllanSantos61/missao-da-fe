"use client";

import { useEffect, useState } from "react";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SimpleBarChart } from "@/components/dashboard/SimpleBarChart";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { getAdminDashboardData, type AdminDashboardData } from "@/services/adminDashboardService";

export function DashboardClient() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const nextData = await getAdminDashboardData();
      if (!isMounted) return;
      setData(nextData);
      setIsLoading(false);
    }

    void loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-parchment px-4 py-5 text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[2rem] bg-navy p-5 text-white shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-white p-2">
                <MissaoDaFeLogo size="header" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Dashboard Administrativo</p>
              <h1 className="mt-2 text-3xl font-black">Crescimento do Missão da Fé</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">
                Visão somente leitura para acompanhar retenção, jornada, missões e compartilhamentos. Pronto para proteção admin futura.
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">
              {data?.source === "supabase" ? "Supabase conectado" : "Sem dados"}
            </span>
          </div>
        </header>

        {isLoading || !data ? (
          <section className="rounded-[1.5rem] bg-white p-8 text-center shadow-card">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-gold/35" />
            <p className="mt-4 font-black text-navy">Carregando métricas...</p>
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
              <SimpleBarChart
                title="Distribuição por dia da jornada"
                points={data.journeyDistribution}
                emptyLabel="Ainda não há progresso suficiente na jornada."
              />
              <FunnelChart steps={data.funnel} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
