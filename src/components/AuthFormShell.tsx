"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import {
  linkExistingProgressToAuth,
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  updatePassword
} from "@/services/authService";
import { getUserProgress } from "@/services/progressService";

type AuthMode = "login" | "register" | "forgot" | "reset";

type AuthFormShellProps = {
  mode: AuthMode;
};

const content: Record<AuthMode, { title: string; subtitle: string; button: string }> = {
  login: {
    title: "Entrar na Missão da Fé",
    subtitle: "Acesse sua conta para continuar sua jornada em qualquer dispositivo.",
    button: "Entrar"
  },
  register: {
    title: "Criar conta",
    subtitle: "Proteja sua caminhada e mantenha seu progresso salvo na nuvem.",
    button: "Criar conta"
  },
  forgot: {
    title: "Recuperar senha",
    subtitle: "Informe seu e-mail para receber o link de redefinição.",
    button: "Enviar link"
  },
  reset: {
    title: "Nova senha",
    subtitle: "Defina uma nova senha para sua conta.",
    button: "Salvar nova senha"
  }
};

export function AuthFormShell({ mode }: AuthFormShellProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const copy = content[mode];
  const needsEmail = mode !== "reset";
  const needsPassword = mode === "login" || mode === "register" || mode === "reset";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        const user = await signInWithEmail(email, password);
        await linkExistingProgressToAuth(getUserProgress(), user);
        router.push("/");
        return;
      }

      if (mode === "register") {
        const user = await registerWithEmail(email, password);
        await linkExistingProgressToAuth(getUserProgress(), user);
        setMessage("Conta criada. Se o Supabase pedir confirmação, confira seu e-mail.");
        window.setTimeout(() => router.push("/"), 1200);
        return;
      }

      if (mode === "forgot") {
        await sendPasswordReset(email);
        setMessage("Enviamos um link de recuperação para seu e-mail.");
        return;
      }

      await updatePassword(password);
      setMessage("Senha atualizada. Você já pode voltar para sua jornada.");
      window.setTimeout(() => router.push("/"), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a ação.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-6 text-ink">
      <section className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex justify-center">
          <MissaoDaFeLogo size="home" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-gold">Conta</p>
        <h1 className="mt-2 text-3xl font-black text-navy">{copy.title}</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-ink/65">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {needsEmail ? (
            <Field label="E-mail">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none focus:ring-4 focus:ring-gold/20"
              />
            </Field>
          ) : null}

          {needsPassword ? (
            <Field label={mode === "reset" ? "Nova senha" : "Senha"}>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none focus:ring-4 focus:ring-gold/20"
              />
            </Field>
          ) : null}

          {message ? <p className="rounded-2xl bg-faithGreen/12 p-3 text-sm font-black text-faithGreen">{message}</p> : null}
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-black text-red-700">{error}</p> : null}

          <button disabled={isLoading} className="w-full rounded-2xl bg-navy px-5 py-4 font-black text-white disabled:bg-stone">
            {isLoading ? "Aguarde..." : copy.button}
          </button>
        </form>

        <div className="mt-5 grid gap-2 text-center text-sm font-bold text-navy">
          {mode !== "login" ? <Link href="/login">Já tenho conta</Link> : null}
          {mode !== "register" ? <Link href="/register">Criar conta</Link> : null}
          {mode === "login" ? <Link href="/forgot-password">Esqueci minha senha</Link> : null}
          <Link href="/">Continuar como visitante</Link>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-navy">{label}</span>
      {children}
    </label>
  );
}
