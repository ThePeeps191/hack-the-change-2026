import { Suspense } from "react";
import { MatchScreen } from "@/features/matching/match-screen";

export default function Page() {
  return (
    <Suspense>
      <MatchScreen />
    </Suspense>
  );
}
