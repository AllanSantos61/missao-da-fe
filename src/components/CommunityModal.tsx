"use client";

import { useState } from "react";
import { AppModal } from "@/components/AppModal";
import type { CommunityInfo } from "@/types/dailyProgress";

type CommunityModalProps = {
  community: CommunityInfo;
  onSave: (community: CommunityInfo) => void;
  onClose: () => void;
};

export function CommunityModal({ community, onSave, onClose }: CommunityModalProps) {
  const [form, setForm] = useState(community);

  function updateField(field: keyof CommunityInfo, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <AppModal title="Minha comunidade" onClose={onClose}>
      <div className="space-y-3">
        {[
          ["city", "Cidade"],
          ["parish", "Paróquia"],
          ["groupName", "Grupo"],
          ["diocese", "Diocese"]
        ].map(([field, label]) => (
          <label key={field} className="block">
            <span className="text-sm font-black text-navy">{label}</span>
            <input
              value={form[field as keyof CommunityInfo]}
              onChange={(event) => updateField(field as keyof CommunityInfo, event.target.value)}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none focus:ring-4 focus:ring-gold/25"
              placeholder={label}
            />
          </label>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onClose} className="rounded-2xl bg-parchment px-4 py-3 font-black text-navy">
          Cancelar
        </button>
        <button
          onClick={() => {
            onSave(form);
            onClose();
          }}
          className="rounded-2xl bg-gold px-4 py-3 font-black text-navy shadow-card"
        >
          Salvar
        </button>
      </div>
    </AppModal>
  );
}
