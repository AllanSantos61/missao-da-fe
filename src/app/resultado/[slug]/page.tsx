import { PublicResultPage } from "@/components/PublicResultPage";

type ResultPageProps = {
  params: {
    slug: string;
  };
};

export default function ResultadoPage({ params }: ResultPageProps) {
  return <PublicResultPage slug={params.slug} />;
}
