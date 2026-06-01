import { redirect } from "next/navigation";

export default function PalavraRedirectPage() {
  redirect("/?missao=word");
}
