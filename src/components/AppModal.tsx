"use client";

import type { ReactNode } from "react";

type AppModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function AppModal({ title, children, onClose }: AppModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 px-4 pb-4 sm:items-center sm:justify-center">
      <section className="w-full max-w-md rounded-[1.75rem] bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-navy">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-parchment px-3 py-2 text-sm font-black text-navy"
          >
            Fechar
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}
