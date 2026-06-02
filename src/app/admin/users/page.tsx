"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type AdminUser = {
  id: string;
  user_id: string | null;
  local_user_id: string | null;
  player_name: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
  current_journey_day: number | null;
  completed_days: number | null;
  journey_start_date: string | null;
  last_access_date: string | null;
  last_completed_date: string | null;
  highest_completed_day?: number | null;
  source?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

function getUserIdentifier(user: AdminUser) {
  return user.local_user_id || user.user_id || user.id;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.player_name, user.local_user_id, user.user_id, user.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [search, users]);

  async function parseResponse<T>(response: Response): Promise<T> {
    const body = (await response.json()) as ApiResponse<T>;
    if (!response.ok || body.success === false) {
      throw new Error(body.error || "Ação administrativa falhou.");
    }
    return body.data as T;
  }

  const loadUsers = useCallback(async function loadUsers() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users");
      const data = await parseResponse<{ users: AdminUser[] }>(response);
      setUsers(data.users ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function postAction(path: string, label: string, body?: Record<string, unknown>) {
    setError("");
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      await parseResponse(response);
      setMessage(`${label} realizado com sucesso.`);
      setSelectedUser(null);
      await loadUsers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Falha ao executar ${label}.`);
    }
  }

  async function deleteUser(user: AdminUser) {
    const userId = getUserIdentifier(user);
    if (!window.confirm(`Tem certeza que deseja apagar ${user.player_name || "este usuário"}?`)) return;
    await postAction("/api/admin/delete-user", "Usuário apagado", { userId });
  }

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <AdminShell title="Usuários">
      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, user_id ou local_user_id"
            className="min-w-0 flex-1 rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none"
          />
          <button onClick={loadUsers} className="rounded-2xl bg-navy px-5 py-3 font-black text-white">
            Atualizar
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => postAction("/api/admin/clear-test-data", "Limpeza de testes")}
            className="rounded-2xl bg-parchment px-4 py-3 text-sm font-black text-navy"
          >
            Excluir dados de teste
          </button>
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-faithGreen/15 p-4 font-black text-faithGreen">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 p-4 font-black text-red-700">{error}</p> : null}

      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-navy">Lista de usuários</h2>
            <p className="text-sm font-bold text-ink/55">{filteredUsers.length} usuário(s) encontrado(s)</p>
          </div>
          {isLoading ? <span className="text-sm font-bold text-ink/55">Carregando...</span> : null}
        </div>

        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <p className="rounded-2xl bg-parchment p-4 font-bold text-ink/60">Nenhum usuário encontrado.</p>
          ) : (
            filteredUsers.map((user) => {
              const userId = getUserIdentifier(user);
              return (
                <article key={userId} className="rounded-2xl bg-parchment p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <button type="button" onClick={() => setSelectedUser(user)} className="text-left">
                      <p className="text-lg font-black text-navy">{user.player_name || "Sem nome"}</p>
                      <p className="mt-1 text-xs font-bold text-ink/50">local_user_id: {user.local_user_id || "sem local_user_id"}</p>
                      <p className="text-xs font-bold text-ink/50">user_id: {user.user_id || "sem user_id"}</p>
                      <p className="mt-2 text-sm font-bold text-ink/65">
                        XP {user.total_xp ?? 0} · Semana {user.weekly_xp ?? 0} · Sequência {user.current_streak ?? 0} · Melhor {user.best_streak ?? 0}
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink/65">
                        Dia atual {user.current_journey_day ?? 1} · Concluídos {user.completed_days ?? 0} · Início {user.journey_start_date || "-"} · Último acesso {user.last_access_date || "-"}
                      </p>
                    </button>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <button onClick={() => postAction("/api/admin/reset-xp", "Reset de XP", { userId })} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy">
                        Reset XP
                      </button>
                      <button onClick={() => postAction("/api/admin/reset-xp", "Reset semanal", { userId, weeklyOnly: true })} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy">
                        Reset semanal
                      </button>
                      <button onClick={() => postAction("/api/admin/reset-user", "Reset de progresso", { userId })} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy">
                        Reset progresso
                      </button>
                      <button onClick={() => deleteUser(user)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                        Apagar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {selectedUser ? (
        <section className="fixed inset-0 z-50 flex items-end bg-navy/50 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Detalhes do usuário</p>
                <h3 className="mt-1 text-2xl font-black text-navy">{selectedUser.player_name || "Sem nome"}</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="rounded-full bg-parchment px-3 py-2 text-xs font-black text-navy">
                Fechar
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(selectedUser).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-parchment p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-gold">{key}</p>
                  <p className="mt-1 break-all text-sm font-bold text-navy">{String(value ?? "-")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
