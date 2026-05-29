import { dailyChallengeData } from "@/data/dailyChallengeData";
import type { DailyChallengeData } from "@/types/dailyChallenge";

export async function getDailyChallengeContent(): Promise<DailyChallengeData> {
  return dailyChallengeData;
}
