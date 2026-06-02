"use client";

import { useEffect, useState } from "react";

import { getDailyReading, type BibleApiReading } from "@/services/bibleApi";
import type { BibleReading } from "@/types/bibleJourney";

type BibleApiReadingState = {
  reading: BibleApiReading | null;
  isLoading: boolean;
};

export function useBibleApiReading(reading: BibleReading) {
  const [state, setState] = useState<BibleApiReadingState>({
    reading: null,
    isLoading: true
  });

  useEffect(() => {
    let isActive = true;

    setState({ reading: null, isLoading: true });

    async function loadReading() {
      try {
        const apiReading = await getDailyReading(reading);
        if (!isActive) return;
        setState({ reading: apiReading, isLoading: false });
      } catch (error) {
        if (!isActive) return;
        setState({
          reading: {
            reference: reading.reference,
            text: reading.content || "Texto bíblico indisponível no momento. Tente novamente em instantes.",
            translation: "almeida",
            verses: [],
            source: "fallback",
            errorMessage: error instanceof Error ? error.message : "Não foi possível carregar o texto bíblico."
          },
          isLoading: false
        });
      }
    }

    void loadReading();

    return () => {
      isActive = false;
    };
  }, [reading]);

  return state;
}
