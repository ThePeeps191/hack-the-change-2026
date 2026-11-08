import { AUTH_MODE } from "@/lib/env";
import { PrivacyScreen } from "@/features/onboarding/privacy-screen";

// With mock login everyone is Sam, a shared demo account. Deleting there keeps
// his sample history (see deleteMyData), so the screen says so.
export default function Page() {
  return <PrivacyScreen shared={AUTH_MODE === "mock"} />;
}
