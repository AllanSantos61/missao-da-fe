"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { clearMissionFaithLocalData, getSyncDiagnostics, type ClientSyncDiagnostics } from "@/services/clientStorageSync";
import { resolveAdminUserKey } from "@/lib/adminUserIdentity";

type AdminUser = {
  id: string;
  profile_id?: string | null;
  progress_id?: string | null;
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

function getIdentityPayload(user: AdminUser) {
  const profileId = user.profile_id || user.id || null;
  const localUserId = user.local_user_id || null;
  const userId = user.user_id || null;
  const resolved = resolveAdminUserKey({ profileId, localUserId, userId });
  return {
    profileId: resolved.profileId,
    localUserId: resolved.localUserId,
    userId: resolved.userId,
    keyType: resolved.keyType,
    key: resolved.key
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [diagnostics, setDiagnostics] = useState<ClientSyncDiagnostics | null>(null);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.player_name, user.local_user_id, user.user_id, user.profile_id, user.id]
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

  async function postAction(path: string, label: string, user?: AdminUser, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    setError("");
    setMessage("");
    const payload = user ? getIdentityPayload(user) : undefined;
    const loadingKey = `${path}:${payload?.key ?? "global"}`;
    setActionLoadingKey(loadingKey);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined
      });
      await parseResponse(response);
      if (path.includes("reset") || path.includes("delete-user")) {
        await clearMissionFaithLocalData();
        setDiagnostics(getSyncDiagnostics());
      }
      setMessage(`${label} realizado com sucesso.`);
      setSelectedUser(null);
      await loadUsers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Falha ao executar ${label}.`);
    } finally {
      setActionLoadingKey("");
    }
  }

  async function clearLocalAndResync() {
    if (!window.confirm("Limpar dados locais deste navegador e ressincronizar com o banco?")) return;
    setError("");
    setMessage("");
    try {
      await clearMissionFaithLocalData();
      setDiagnostics(getSyncDiagnostics());
      setMessage("Dados locais limpos. A próxima abertura do app buscará o estado do banco.");
      await loadUsers();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Não foi possível limpar dados locais.");
    }
  }

  useEffect(() => {
    setDiagnostics(getSyncDiagnostics());
    void loadUsers();
  }, [loadUsers]);

  return (
    <AdminShell title="Usuários">
      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, profile.id, user_id ou local_user_id"
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
          <button
            onClick={clearLocalAndResync}
            className="rounded-2xl bg-gold px-4 py-3 text-sm font-black text-navy"
          >
            Limpar dados locais e ressincronizar
          </button>
        </div>
      </section>

      {diagnostics ? (
        <section className="rounded-[1.5rem] bg-navy p-5 text-white shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Diagnóstico de sincronização</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold text-white/60">Origem</p>
              <p className="mt-1 font-black">{diagnostics.source}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold text-white/60">Status</p>
              <p className="mt-1 font-black">{diagnostics.status}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold text-white/60">Última sincronização</p>
              <p className="mt-1 break-all font-black">{diagnostics.lastSyncAt || "-"}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold text-white/60">Versões</p>
              <p className="mt-1 break-all text-sm font-black">Local: {diagnostics.localVersion}</p>
              <p className="mt-1 break-all text-sm font-black">Banco: {diagnostics.remoteVersion}</p>
            </div>
          </div>
        </section>
      ) : null}

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
              const identity = getIdentityPayload(user);
              const loadingSuffix = `:${identity.key}`;
              const isActionLoading = actionLoadingKey.endsWith(loadingSuffix);
              return (
                <article key={identity.key} className="rounded-2xl bg-parchment p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <button type="button" onClick={() => setSelectedUser(user)} className="text-left">
                      <p className="text-lg font-black text-navy">{user.player_name || "Sem nome"}</p>
                      <p className="mt-1 text-xs font-bold text-ink/50">profile.id: {user.profile_id || user.id || "ID legado"}</p>
                      <p className="text-xs font-bold text-ink/50">local_user_id: {user.local_user_id || "ID legado"}</p>
                      <p className="text-xs font-bold text-ink/50">user_id: {user.user_id || "ID legado"}</p>
                      <p className="mt-2 text-xs font-black uppercase tracking-wide text-gold">Ações por: {identity.keyType}</p>
                      <p className="mt-2 text-sm font-bold text-ink/65">
                        XP {user.total_xp ?? 0} · Semana {user.weekly_xp ?? 0} · Sequência {user.current_streak ?? 0} · Melhor {user.best_streak ?? 0}
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink/65">
                        Dia atual {user.current_journey_day ?? 1} · Concluídos {user.completed_days ?? 0} · Início {user.journey_start_date || "-"} · Último acesso {user.last_access_date || "-"}
                      </p>
                    </button>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <button disabled={isActionLoading} onClick={() => postAction("/api/admin/reset-xp", "Reset de XP", user)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy disabled:opacity-50">
                        Reset XP
                      </button>
                      <button disabled={isActionLoading} onClick={() => postAction("/api/admin/reset-weekly", "Reset semanal", user)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy disabled:opacity-50">
                        Reset semanal
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => postAction("/api/admin/reset-user", "Reset de progresso", user, "Tem certeza que deseja resetar o progresso deste usuário?")}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-black text-navy disabled:opacity-50"
                      >
                        Reset progresso
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => postAction("/api/admin/delete-user", "Usuário apagado", user, `Tem certeza que deseja apagar ${user.player_name || "este usuário"}?`)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-50"
                      >
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
              {Object.entries({ ...selectedUser, admin_identity: JSON.stringify(getIdentityPayload(selectedUser)) }).map(([key, value]) => (
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
