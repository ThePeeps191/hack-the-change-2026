import { Suspense } from "react";
import { ProofScreen } from "@/features/proof/proof-screen";

export default function Page() {
  return (
    <Suspense>
      <ProofScreen />
    </Suspense>
  );
}
