import { redirect } from "next/navigation";

export default function ThrowLegacyRedirect() {
  redirect("/");
}
