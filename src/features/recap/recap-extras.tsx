import type { Recap } from "@/lib/contracts";
import { Card } from "@/components/ui/card";

// The verified photos, and a quiet note when the same two people meet again.
export function RecapExtras({ recap }: { recap: Recap }) {
  const again = recap.partner && (recap.times_together ?? 0) >= 2;
  if (recap.photos.length === 0 && !again) return null;
  return (
    <>
      {recap.photos.length > 0 && (
        <div className={`grid gap-2 ${recap.photos.length > 1 ? "grid-cols-2" : ""}`}>
          {recap.photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="verified proof from this quest" className="aspect-square w-full rounded-card bg-sunken object-cover" />
          ))}
        </div>
      )}
      {again && (
        <Card className="p-4">
          <p className="font-semibold">that&apos;s {recap.times_together} quests with {recap.partner!.display_name}</p>
          <p className="mt-1 text-sm text-ink-muted">friendships start with time spent together. you&apos;re on your way.</p>
        </Card>
      )}
    </>
  );
}
