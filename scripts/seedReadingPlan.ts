import { getSeedClient } from "./seedClient";

async function main() {
  const supabase = getSeedClient();
  const { data, error } = await supabase
    .from("bible_readings")
    .select("id, order_index, title, estimated_minutes")
    .eq("active", true)
    .order("order_index", { ascending: true })
    .limit(365);

  if (error) throw error;
  if (!data || data.length < 365) {
    throw new Error(`Expected 365 bible_readings rows, found ${data?.length ?? 0}. Run npm run seed:bible first.`);
  }

  for (const reading of data) {
    const { error: upsertError } = await supabase.from("reading_plan").upsert(
      {
        day_number: reading.order_index,
        reading_id: reading.id,
        title: reading.title,
        estimated_minutes: reading.estimated_minutes ?? 10,
        xp_reward: 40,
        active: true
      },
      { onConflict: "day_number" }
    );

    if (upsertError) throw upsertError;
  }

  console.log("Seeded 365 reading_plan rows.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
