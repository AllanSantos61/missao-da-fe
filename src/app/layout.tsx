import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Missão da Fé — O desafio diário da fé",
  description:
    "Complete sua missão diária com Evangelho, Quiz da Fé e Palavra da Fé em poucos minutos.",
  keywords: [
    "missão da fé",
    "desafio católico",
    "evangelho do dia",
    "quiz bíblico",
    "palavra da fé",
    "jogo católico",
    "desafio diário católico"
  ],
  icons: {
    icon: "/logo-missao-da-fe.png",
    apple: "/logo-missao-da-fe.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F8F5EF"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
