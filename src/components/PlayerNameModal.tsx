"use client";

import { useState } from "react";
import { AppModal } from "@/components/AppModal";

type PlayerNameModalProps = {
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
};

export function PlayerNameModal({ currentName, onSave, onClose }: PlayerNameModalProps) {
  const [name, setName] = useState(currentName);

  function handleSave() {
    onSave(name);
    onClose();
  }

  return (
    <AppModal title="Meu nome" onClose={onClose}>
      <label className="block">
        <span className="text-sm font-black text-navy">Como você quer aparecer no ranking?</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do jogador"
          maxLength={32}
          className="mt-3 w-full rounded-2xl border border-navy/12 bg-parchment px-4 py-4 text-base font-bold text-ink outline-none ring-gold/30 transition focus:ring-4"
        />
      </label>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={onClose}
          className="rounded-2xl border border-navy/12 bg-white px-4 py-3 font-black text-navy"
        >
          Cancelar
        </button>
        <button onClick={handleSave} className="rounded-2xl bg-navy px-4 py-3 font-black text-white">
          Salvar
        </button>
      </div>
    </AppModal>
  );
}
