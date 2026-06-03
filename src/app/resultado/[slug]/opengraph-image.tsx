import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { formatDias } from "@/utils/pluralize";

export const runtime = "edge";
export const alt = "Resultado da Missão da Fé";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

type OgResult = {
  player_name: string;
  journey_day: number;
  daily_xp: number;
  streak: number;
};

function safeDay(day?: number | null) {
  return Number.isFinite(day) && Number(day) >= 1 ? Math.min(365, Math.round(Number(day))) : 1;
}

async function fetchResult(slug: string): Promise<OgResult | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase
      .from("public_results")
      .select("player_name, journey_day, daily_xp, streak")
      .eq("share_slug", slug)
      .limit(1);

    if (error || !data?.[0]) return null;
    return data[0] as OgResult;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { slug: string } }) {
  const result = await fetchResult(params.slug);
  const day = safeDay(result?.journey_day);
  const playerName = result?.player_name || "Peregrino";
  const xp = Math.max(0, Number(result?.daily_xp ?? 0));
  const streak = Math.max(0, Number(result?.streak ?? 0));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#12355B",
          color: "#FFFFFF",
          fontFamily: "Inter, Arial, sans-serif",
          padding: 56
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "3px solid rgba(214,169,58,0.55)",
            borderRadius: 42,
            padding: 46,
            background: "linear-gradient(135deg, #12355B 0%, #0B2440 100%)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 24,
                background: "#D6A93A",
                color: "#12355B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 900
              }}
            >
              ✝
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 44, fontWeight: 900 }}>Missão da Fé</div>
              <div style={{ marginTop: 4, fontSize: 22, color: "rgba(255,255,255,0.72)" }}>
                Leia o Novo Testamento em 365 dias
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#D6A93A" }}>{playerName}</div>
            <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1 }}>
              Dia {day} de 365
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
              <div style={pillStyle}>🔥 Sequência {formatDias(streak)}</div>
              <div style={pillStyle}>⭐ XP {xp}</div>
              <div style={pillStyle}>📖 10 min/dia</div>
            </div>
          </div>

          <div style={{ fontSize: 30, fontWeight: 800, color: "#F8F5EF" }}>
            Uma missão por dia: Bíblia, quiz e Palavra da Fé.
          </div>
        </div>
      </div>
    ),
    size
  );
}

const pillStyle = {
  borderRadius: 999,
  background: "#F8F5EF",
  padding: "16px 22px",
  fontSize: 26,
  fontWeight: 900,
  color: "#12355B"
};
