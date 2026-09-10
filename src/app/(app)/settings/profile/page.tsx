import { requireUser } from "@/lib/session";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const me = await requireUser();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-copper-900">Profile</h1>
      <p className="mt-2 text-sm text-copper-700">Chapter membership cannot be changed here.</p>
      <div className="mt-6">
        <ProfileForm name={me.name} unitsPreference={me.unitsPreference} />
      </div>
    </div>
  );
}
