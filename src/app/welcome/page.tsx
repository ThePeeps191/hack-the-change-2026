import { Suspense } from "react";
import { WelcomeScreen } from "@/features/onboarding/welcome-screen";

export const metadata = { title: "Welcome" };

// Suspense because the screen reads ?next= from the URL.
export default function Page() {
  return (
    <Suspense>
      <WelcomeScreen />
    </Suspense>
  );
}
