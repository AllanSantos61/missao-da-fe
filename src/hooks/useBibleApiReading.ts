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

    getDailyReading(reading).then((apiReading) => {
      if (!isActive) return;
      setState({ reading: apiReading, isLoading: false });
    });

    return () => {
      isActive = false;
    };
  }, [reading]);

  return state;
}
