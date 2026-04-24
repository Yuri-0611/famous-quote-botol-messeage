import { redirect } from "next/navigation";

export default function CatchLegacyRedirect() {
  redirect("/");
}
