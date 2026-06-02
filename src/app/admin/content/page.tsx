"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatDias, formatUnit } from "@/utils/pluralize";

type QuestionRow = {
  id: string;
  question_order: number | null;
  question: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  correct_option: string | null;
  explanation: string | null;
};

type JourneyDayRow = {
  id: string;
  day_number: number;
  title: string | null;
  bible_reference: string | null;
  bible_book: string | null;
  faith_word: string | null;
  normalized_faith_word: string | null;
  estimated_minutes: number | null;
  reading_xp: number | null;
  quiz_xp: number | null;
  word_xp: number | null;
  questions: QuestionRow[];
};

type Diagnostics = {
  totalDays: number;
  totalQuestions: number;
  daysWithLessThan3Questions: number[];
  daysWithoutWord: number[];
  daysWithoutReference: number[];
  duplicatedWords: string[];
  duplicatedDayNumbers: number[];
  incompleteDays: number;
};

type EditingState =
  | { type: "journey"; item: JourneyDayRow }
  | { type: "question"; item: QuestionRow };

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

const JOURNEY_FIELDS = ["title", "bible_reference", "faith_word", "normalized_faith_word", "estimated_minutes", "reading_xp", "quiz_xp", "word_xp"] as const;
const QUESTION_FIELDS = ["question", "option_a", "option_b", "option_c", "correct_option", "explanation"] as const;

export default function AdminContentPage() {
  const [day, setDay] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [days, setDays] = useState<JourneyDayRow[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const incompleteSummary = useMemo(() => {
    if (!diagnostics) return "";
    const parts = [
      diagnostics.daysWithLessThan3Questions.length ? `${formatDias(diagnostics.daysWithLessThan3Questions.length)} com menos de 3 perguntas` : "",
      diagnostics.daysWithoutWord.length ? `${formatDias(diagnostics.daysWithoutWord.length)} sem palavra` : "",
      diagnostics.daysWithoutReference.length ? `${formatDias(diagnostics.daysWithoutReference.length)} sem referência` : ""
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "0 dias incompletos";
  }, [diagnostics]);

  const loadContent = useCallback(async function loadContent() {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (day) params.set("day", day);
      if (query) params.set("q", query);
      if (filter !== "all") params.set("filter", filter);

      const response = await fetch(`/api/admin/content?${params.toString()}`);
      const body = (await response.json()) as ApiResponse<{ days: JourneyDayRow[]; diagnostics: Diagnostics }>;
      if (!response.ok || body.success === false) throw new Error(body.error || "Não foi possível carregar conteúdo.");

      setDays(body.data?.days ?? []);
      setDiagnostics(body.data?.diagnostics ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar conteúdo.");
    } finally {
      setIsLoading(false);
    }
  }, [day, filter, query]);

  async function save() {
    if (!editing) return;
    setError("");
    setMessage("");

    const values = editing.type === "journey"
      ? {
          title: editing.item.title,
          bible_reference: editing.item.bible_reference,
          faith_word: editing.item.faith_word,
          normalized_faith_word: editing.item.normalized_faith_word,
          estimated_minutes: Number(editing.item.estimated_minutes ?? 10),
          reading_xp: Number(editing.item.reading_xp ?? 40),
          quiz_xp: Number(editing.item.quiz_xp ?? 45),
          word_xp: Number(editing.item.word_xp ?? 35)
        }
      : {
          question: editing.item.question,
          option_a: editing.item.option_a,
          option_b: editing.item.option_b,
          option_c: editing.item.option_c,
          correct_option: editing.item.correct_option,
          explanation: editing.item.explanation
        };

    try {
      const response = await fetch("/api/admin/update-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: editing.type, id: editing.item.id, values })
      });
      const body = (await response.json()) as ApiResponse<{ updated: boolean }>;
      if (!response.ok || body.success === false) throw new Error(body.error || "Não foi possível salvar.");

      setMessage("Conteúdo salvo com sucesso.");
      setEditing(null);
      await loadContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar conteúdo.");
    }
  }

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  return (
    <AdminShell title="Conteúdo">
      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[120px_1fr_240px_120px]">
          <input
            type="number"
            min={1}
            max={365}
            value={day}
            onChange={(event) => setDay(event.target.value)}
            placeholder="Dia"
            className="rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-black text-navy"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por palavra, referência, pergunta ou alternativa"
            className="rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-bold text-navy"
          />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-black text-navy">
            <option value="all">Todos</option>
            <option value="missing_questions">Dias com menos de 3 perguntas</option>
            <option value="incomplete">Dias incompletos</option>
          </select>
          <button onClick={loadContent} className="rounded-2xl bg-gold px-4 py-3 font-black text-navy">
            Buscar
          </button>
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-faithGreen/15 p-4 font-black text-faithGreen">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 p-4 font-black text-red-700">{error}</p> : null}

      {diagnostics ? (
        <section className="rounded-[1.5rem] bg-navy p-5 text-white shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Diagnóstico do banco</p>
          <p className="mt-2 text-sm font-bold text-white/75">{incompleteSummary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Diag label="Dias cadastrados" value={diagnostics.totalDays} />
            <Diag label="Perguntas" value={diagnostics.totalQuestions} />
            <Diag label="Dias incompletos" value={diagnostics.incompleteDays} />
            <Diag label="Palavras duplicadas" value={diagnostics.duplicatedWords.length} />
            <Diag label="Sem palavra" value={diagnostics.daysWithoutWord.length} />
            <Diag label="Sem referência" value={diagnostics.daysWithoutReference.length} />
            <Diag label="Day number duplicado" value={diagnostics.duplicatedDayNumbers.length} />
            <Diag label="Menos de 3 perguntas" value={diagnostics.daysWithLessThan3Questions.length} />
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.5rem] bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-navy">Jornada da Fé</h2>
            <p className="text-sm font-bold text-ink/55">{formatUnit(days.length, "dia exibido", "dias exibidos")}</p>
          </div>
          {isLoading ? <span className="text-sm font-bold text-ink/55">Carregando...</span> : null}
        </div>

        <div className="space-y-4">
          {days.length === 0 ? (
            <p className="rounded-2xl bg-parchment p-4 font-bold text-ink/60">Nenhum conteúdo encontrado.</p>
          ) : (
            days.map((dayItem) => (
              <article key={dayItem.id} className="rounded-2xl bg-parchment p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Dia {dayItem.day_number}</p>
                    <h3 className="mt-1 text-xl font-black text-navy">{dayItem.title || "Sem título"}</h3>
                    <p className="mt-2 text-sm font-bold text-ink/65">
                      {dayItem.bible_reference || "Sem referência"} · Palavra: {dayItem.faith_word || "-"} · {dayItem.estimated_minutes ?? 10} min
                    </p>
                    <p className="mt-1 text-xs font-bold text-ink/55">
                      XP leitura {dayItem.reading_xp ?? 40} · quiz {dayItem.quiz_xp ?? 45} · palavra {dayItem.word_xp ?? 35}
                    </p>
                  </div>
                  <button onClick={() => setEditing({ type: "journey", item: dayItem })} className="rounded-xl bg-navy px-4 py-2 text-sm font-black text-white">
                    Editar dia
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {dayItem.questions.length === 0 ? (
                    <p className="rounded-xl bg-white p-3 text-sm font-bold text-red-700">Sem perguntas cadastradas.</p>
                  ) : (
                    dayItem.questions.map((question) => (
                      <div key={question.id} className="rounded-xl bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black text-navy">{question.question_order ?? "?"}. {question.question}</p>
                            <p className="mt-2 text-sm font-bold text-ink/65">A. {question.option_a}</p>
                            <p className="text-sm font-bold text-ink/65">B. {question.option_b}</p>
                            <p className="text-sm font-bold text-ink/65">C. {question.option_c}</p>
                            <p className="mt-2 text-xs font-black text-gold">Resposta: {question.correct_option}</p>
                            {question.explanation ? <p className="mt-1 text-xs font-bold text-ink/55">{question.explanation}</p> : null}
                          </div>
                          <button onClick={() => setEditing({ type: "question", item: question })} className="rounded-xl bg-parchment px-3 py-2 text-xs font-black text-navy">
                            Editar pergunta
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {editing ? (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-5 shadow-soft">
            <h3 className="text-2xl font-black text-navy">Editar {editing.type === "journey" ? "dia" : "pergunta"}</h3>
            <div className="mt-4 space-y-3">
              {(editing.type === "journey" ? JOURNEY_FIELDS : QUESTION_FIELDS).map((field) => (
                <label key={field} className="block">
                  <span className="text-sm font-black text-navy">{field}</span>
                  <textarea
                    value={String((editing.item as Record<string, unknown>)[field] ?? "")}
                    onChange={(event) =>
                      setEditing((current) =>
                        current?.type === "journey"
                          ? { type: "journey", item: { ...current.item, [field]: event.target.value } as JourneyDayRow }
                          : current?.type === "question"
                            ? { type: "question", item: { ...current.item, [field]: event.target.value } as QuestionRow }
                            : current
                      )
                    }
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

function Diag({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-xs font-bold text-white/65">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
