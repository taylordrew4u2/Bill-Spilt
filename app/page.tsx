import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware gates auth; logged-in users land on Home, others on /login.
  redirect("/home");
}
