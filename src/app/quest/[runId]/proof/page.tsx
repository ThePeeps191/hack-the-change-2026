import { Suspense } from "react";
import { ProofScreen } from "@/features/proof/proof-screen";
import { DEMO_MODE } from "@/lib/env";

export default function Page() {
  return (
    <Suspense>
      <ProofScreen demo={DEMO_MODE} />
    </Suspense>
  );
}
