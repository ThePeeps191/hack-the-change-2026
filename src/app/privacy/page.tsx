import { AUTH_MODE } from "@/lib/env";
import { currentUser } from "@/lib/auth";
import { PrivacyScreen } from "@/features/onboarding/privacy-screen";

// With mock login everyone is Sam, a shared demo account. Deleting there keeps
// his sample history (see deleteMyData), so the screen says so. Signed out, the
// page still explains what we keep, without the account buttons.
export default async function Page() {
  const user = await currentUser().catch(() => null);
  return <PrivacyScreen shared={AUTH_MODE === "mock"} signedIn={user != null} />;
}
