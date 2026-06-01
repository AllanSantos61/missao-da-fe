"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    setIsLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Login inválido." }));
      setError(body.error ?? "Login inválido.");
      return;
    }

    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;

    router.replace(next || "/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment px-4 py-8 text-ink">
      <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex justify-center">
          <MissaoDaFeLogo size="home" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-black text-navy">Admin Missão da Fé</h1>
        <p className="mt-2 text-center text-sm font-bold text-ink/60">Acesso protegido para administração do produto.</p>
        <label className="mt-6 block">
          <span className="text-sm font-black text-navy">Usuário</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none focus:ring-4 focus:ring-gold/25"
            autoComplete="username"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-black text-navy">Senha</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-2 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none focus:ring-4 focus:ring-gold/25"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
        <button disabled={isLoading} className="mt-5 w-full rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card disabled:opacity-60">
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
