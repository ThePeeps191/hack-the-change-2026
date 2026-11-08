import type { Recap } from "@/lib/contracts";

// The verified photos, and a quiet note when the same two people meet again.
export function RecapExtras({ recap }: { recap: Recap }) {
  const again = recap.partner && !recap.demo_partner && (recap.times_together ?? 0) >= 2;
  if (recap.photos.length === 0 && !again) return null;
  return (
    <>
      {recap.photos.length > 0 && (
        <div className={`grid gap-2 ${recap.photos.length > 1 ? "grid-cols-2" : ""}`}>
          {recap.photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="Verified proof from this quest" className={`w-full rounded-[24px] bg-sunken object-cover shadow-card ${recap.photos.length > 1 ? "aspect-square" : "aspect-[4/3] max-h-[240px]"}`} />
          ))}
        </div>
      )}
      {again && (
        <section className="rounded-[24px] bg-surface p-5 shadow-card">
          <p className="text-[17px] font-semibold">That&apos;s {recap.times_together} quests with {recap.partner!.display_name}</p>
          <p className="mt-1 text-[14px] leading-snug text-ink-muted">Friendships start with time spent together. You&apos;re on your way.</p>
        </section>
      )}
    </>
  );
}
