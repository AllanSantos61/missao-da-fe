import { PublicResultPage } from "@/components/PublicResultPage";
import { getPublicResult } from "@/services/publicResultService";
import type { Metadata } from "next";

type ResultPageProps = {
  params: {
    slug: string;
  };
};

function safeDay(day?: number | null) {
  return Number.isFinite(day) && Number(day) >= 1 ? Math.min(365, Math.round(Number(day))) : 1;
}

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const result = await getPublicResult(params.slug);
  const day = safeDay(result?.journeyDay);
  const title = result
    ? `${result.playerName} está no Dia ${day} da Missão da Fé`
    : "Missão da Fé — Jornada de 365 dias";
  const description = "Leia o Novo Testamento inteiro em apenas 10 minutos por dia com leitura, quiz e Palavra da Fé.";
  const imageUrl = `/resultado/${params.slug}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Resultado da Missão da Fé"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

export default function ResultadoPage({ params }: ResultPageProps) {
  return <PublicResultPage slug={params.slug} />;
}
