import { requireFounder } from "@/lib/auth/session";

export default async function Page() {
  const auth = await requireFounder();
  return (
    <>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        {auth.fullName || auth.email}. Your founder record is created when you register.
        Referral tracking arrives after this sprint.
      </p>
    </>
  );
}
