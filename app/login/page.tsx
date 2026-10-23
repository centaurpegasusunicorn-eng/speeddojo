import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

// The form reads ?next= and ?error= from the address, which needs Suspense
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
