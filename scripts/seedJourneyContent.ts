import { seedJourneyDays } from "./seedJourneyDays";
import { seedJourneyQuiz } from "./seedJourneyQuiz";

async function main() {
  await seedJourneyDays();
  await seedJourneyQuiz();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
