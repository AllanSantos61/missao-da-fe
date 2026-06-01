"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";

type AdminShellProps = {
  title: string;
  children: ReactNode;
};

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Usuários" },
  { href: "/admin/content", label: "Conteúdo" }
];

export function AdminShell({ title, children }: AdminShellProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-5 text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[2rem] bg-navy p-5 text-white shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-white p-2">
                <MissaoDaFeLogo size="header" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Admin</p>
              <h1 className="mt-2 text-3xl font-black">{title}</h1>
            </div>
            <button onClick={logout} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white">
              Sair
            </button>
          </div>
          <nav className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2 text-center text-sm font-black text-white hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
