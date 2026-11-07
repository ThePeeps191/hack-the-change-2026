import { ImpactScreen } from "@/features/impact/impact-screen";
import { getImpact } from "@/server/impact";

// Public (see PUBLIC_PAGES in src/proxy.ts). Read fresh on every visit.
export const dynamic = "force-dynamic";
export const metadata = { title: "Amble impact" };

export default async function Page() {
  const impact = await getImpact().catch(() => null);
  return <ImpactScreen impact={impact} />;
}
