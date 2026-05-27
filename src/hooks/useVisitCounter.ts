"use client";

import { useEffect, useRef, useState } from "react";
import { incrementVisitCounter } from "@/services/siteStatsService";

export function useVisitCounter() {
  const [visits, setVisits] = useState<number | null>(null);
  const didCountVisit = useRef(false);

  useEffect(() => {
    if (didCountVisit.current) return;
    didCountVisit.current = true;

    incrementVisitCounter()
      .then(setVisits)
      .catch(() => setVisits(null));
  }, []);

  return visits;
}
