import { Suspense } from "react";
import { ProofScreen } from "@/features/proof/proof-screen";
import { isDemoGuest } from "@/lib/auth";

export default async function Page() {
  return (
    <Suspense>
      <ProofScreen demo={await isDemoGuest()} />
    </Suspense>
  );
}
