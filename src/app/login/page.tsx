import { DEMO_MODE } from "@/lib/env";
import { LoginScreen } from "@/features/onboarding/login-screen";

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { returnTo } = await searchParams;
  const path = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return <LoginScreen demo={DEMO_MODE} returnTo={path} />;
}
