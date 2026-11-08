import { Suspense } from "react";
import { MatchScreen } from "@/features/matching/match-screen";

export const metadata = { title: "Finding someone" };

export default function Page() {
  return (
    <Suspense>
      <MatchScreen />
    </Suspense>
  );
}
