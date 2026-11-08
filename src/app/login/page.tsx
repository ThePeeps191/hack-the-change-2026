import { DEMO_MODE } from "@/lib/env";
import { LoginScreen } from "@/features/onboarding/login-screen";

export const metadata = { title: "Sign in" };

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { returnTo } = await searchParams;
  // Only a path on this site: "//x" and "/\x" both mean another website to a browser.
  const path = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("\\") ? returnTo : "/";
  return <LoginScreen demo={DEMO_MODE} returnTo={path} />;
}
