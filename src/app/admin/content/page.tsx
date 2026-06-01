"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type ContentRow = Record<string, string | number | boolean | null>;

export default function AdminContentPage() {
  const [day, setDay] = useState(1);
  const [type, setType] = useState<"journey" | "questions">("journey");
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [editing, setEditing] = useState<ContentRow | null>(null);

  const loadContent = useCallback(async function loadContent() {
    const response = await fetch(`/api/admin/content?type=${type}&day=${day}`);
    if (response.ok) {
      const body = await response.json();
      setRows(body.rows ?? []);
    }
  }, [type, day]);

  async function save() {
    if (!editing?.id) return;
    const values = type === "journey"
      ? {
          title: editing.title,
          bible_reference: editing.bible_reference,
          faith_word: editing.faith_word,
          normalized_faith_word: editing.normalized_faith_word,
          estimated_minutes: Number(editing.estimated_minutes ?? 10)
        }
      : {
          question: editing.question,
          option_a: editing.option_a,
          option_b: editing.option_b,
          option_c: editing.option_c,
          correct_option: editing.correct_option,
          explanation: editing.explanation
        };

    await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id: editing.id, values })
    });
    setEditing(null);
    await loadContent();
  }

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  const fields = type === "journey"
    ? ["title", "bible_reference", "faith_word", "normalized_faith_word", "estimated_minutes"]
    : ["question", "option_a", "option_b", "option_c", "correct_option", "explanation"];

  return (
    <AdminShell title="Conteúdo">
      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_120px]">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-parchment p-1">
            <button onClick={() => setType("journey")} className={`rounded-xl px-3 py-2 font-black ${type === "journey" ? "bg-navy text-white" : "text-navy"}`}>
              Jornada e Palavra
            </button>
            <button onClick={() => setType("questions")} className={`rounded-xl px-3 py-2 font-black ${type === "questions" ? "bg-navy text-white" : "text-navy"}`}>
              Perguntas
            </button>
          </div>
          <input
            type="number"
            min={1}
            max={365}
            value={day}
            onChange={(event) => setDay(Number(event.target.value))}
            className="rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-black text-navy"
          />
          <button onClick={loadContent} className="rounded-2xl bg-gold px-4 py-3 font-black text-navy">
            Buscar
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <h2 className="text-xl font-black text-navy">Dia {day}</h2>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="rounded-2xl bg-parchment p-4 font-bold text-ink/60">Nenhum conteúdo encontrado.</p>
          ) : (
            rows.map((row) => (
              <article key={String(row.id)} className="rounded-2xl bg-parchment p-4">
                <p className="font-black text-navy">{String(row.title ?? row.question ?? `Item ${row.id}`)}</p>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-ink/60">
                  {String(row.bible_reference ?? row.explanation ?? row.faith_word ?? "")}
                </p>
                <button onClick={() => setEditing(row)} className="mt-3 rounded-xl bg-navy px-4 py-2 text-sm font-black text-white">
                  Editar
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      {editing ? (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-5 shadow-soft">
            <h3 className="text-2xl font-black text-navy">Editar conteúdo</h3>
            <div className="mt-4 space-y-3">
              {fields.map((field) => (
                <label key={field} className="block">
                  <span className="text-sm font-black text-navy">{field}</span>
                  <textarea
                    value={String(editing[field] ?? "")}
                    onChange={(event) => setEditing((current) => current ? { ...current, [field]: event.target.value } : current)}
                    className="mt-1 min-h-16 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setEditing(null)} className="rounded-2xl bg-parchment px-4 py-3 font-black text-navy">
                Cancelar
              </button>
              <button onClick={save} className="rounded-2xl bg-gold px-4 py-3 font-black text-navy">
                Salvar
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
