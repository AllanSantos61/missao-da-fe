import { adminError, adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

async function updateContent(request: Request) {
  const supabase = requireAdminApi();
  const body = (await request.json()) as {
    type?: "journey" | "question";
    id?: string;
    values?: Record<string, unknown>;
  };

  if (!body.id || !body.values) return adminError("Informe o tipo, id e valores para atualizar.", 400);

  console.info("[Admin] Update content", { type: body.type, id: body.id });
  const type = body.type === "question" ? "question" : "journey";
  const table = type === "question" ? "journey_quiz_questions" : "journey_days";
  const allowedFields =
    type === "question"
      ? ["question", "option_a", "option_b", "option_c", "correct_option", "explanation"]
      : ["title", "bible_reference", "faith_word", "normalized_faith_word", "estimated_minutes", "reading_xp", "quiz_xp", "word_xp"];
  const values = Object.fromEntries(Object.entries(body.values).filter(([key]) => allowedFields.includes(key)));

  if (Object.keys(values).length === 0) return adminError("Nenhum campo permitido foi enviado.", 400);
  const { error } = await supabase.from(table).update(values).eq("id", body.id);
  if (error) throw error;
  return adminSuccess({ updated: true });
}

export async function POST(request: Request) {
  try {
    return await updateContent(request);
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    return await updateContent(request);
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
