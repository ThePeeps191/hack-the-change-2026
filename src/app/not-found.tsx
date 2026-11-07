import { AppShell, Hand } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";

// Any URL we don't have, in the app's own look instead of Next's default page.
export default function NotFound() {
  return (
    <AppShell>
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Hand as="h1" className="text-3xl text-ink">wrong turn</Hand>
        <p className="text-ink-muted">There&apos;s nothing at this address. Your quests are all still where you left them.</p>
        <ButtonLink href="/">Back to today</ButtonLink>
      </div>
    </AppShell>
  );
}
