import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/recipes");

  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold text-copper-900">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
