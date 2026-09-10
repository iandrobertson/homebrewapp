import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listChapters } from "@/server/chapters";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/recipes");

  const chapters = await listChapters();

  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold text-copper-900">Create an account</h1>
      <p className="mt-2 text-sm text-copper-700">
        Join a regional chapter. You will only be able to share recipes with members of that chapter.
      </p>
      <SignupForm chapters={chapters} />
    </>
  );
}
