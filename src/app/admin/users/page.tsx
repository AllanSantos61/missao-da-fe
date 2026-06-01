"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type AdminUser = {
  user_id: string | null;
  player_name: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadUsers(query = "") {
    setIsLoading(true);
    const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
    if (response.ok) {
      const body = await response.json();
      setUsers(body.users ?? []);
    }
    setIsLoading(false);
  }

  async function action(userId: string | null, path: string, method = "POST") {
    if (!userId) return;
    await fetch(`/api/admin/users/${encodeURIComponent(userId)}${path}`, { method });
    await loadUsers(search);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <AdminShell title="Usuários">
      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome"
            className="min-w-0 flex-1 rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none"
          />
          <button onClick={() => loadUsers(search)} className="rounded-2xl bg-navy px-5 py-3 font-black text-white">
            Buscar
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-navy">Lista de usuários</h2>
          {isLoading ? <span className="text-sm font-bold text-ink/55">Carregando...</span> : null}
        </div>
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="rounded-2xl bg-parchment p-4 font-bold text-ink/60">Nenhum usuário encontrado.</p>
          ) : (
            users.map((user) => (
              <article key={user.user_id ?? user.player_name} className="rounded-2xl bg-parchment p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-black text-navy">{user.player_name || "Sem nome"}</p>
                    <p className="mt-1 text-xs font-bold text-ink/50">{user.user_id || "sem user_id"}</p>
                    <p className="mt-2 text-sm font-bold text-ink/65">
                      XP {user.total_xp ?? 0} · Semana {user.weekly_xp ?? 0} · Streak {user.current_streak ?? 0} · Recorde {user.best_streak ?? 0}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button onClick={() => action(user.user_id, "/reset-xp")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy">
                      Reset XP
                    </button>
                    <button onClick={() => action(user.user_id, "/reset-progress")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy">
                      Reset progresso
                    </button>
                    <button onClick={() => action(user.user_id, "", "DELETE")} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                      Apagar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}
