"use client";

import { useEffect, useState } from "react";
import { dailyChallengeData } from "@/data/dailyChallengeData";
import { getDailyChallengeContent } from "@/services/challengeContentService";
import type { DailyChallengeData } from "@/types/dailyChallenge";

export function useDailyChallengeContent() {
  const [content, setContent] = useState<DailyChallengeData>(dailyChallengeData);

  useEffect(() => {
    getDailyChallengeContent().then(setContent);
  }, []);

  return content;
}
