import { redirect } from "next/navigation";

// Signed-out visitors are sent to /login by proxy.ts; signed-in students go
// on to their last exercise via /dashboard.
export default function Home() {
  redirect("/dashboard");
}
