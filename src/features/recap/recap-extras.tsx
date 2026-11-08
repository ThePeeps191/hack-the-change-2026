import type { Recap } from "@/lib/contracts";

// The verified proof (photos, and videos that play in place), and a quiet note
// when the same two people meet again.
export function RecapExtras({ recap }: { recap: Recap }) {
  const again = recap.partner && !recap.demo_partner && (recap.times_together ?? 0) >= 2;
  // Older servers only send `photos`; treat those as images.
  const proof: NonNullable<Recap["proof"]> = recap.proof ?? recap.photos.map((url) => ({ url, type: "image/jpeg" }));
  if (proof.length === 0 && !again) return null;
  const size = proof.length > 1 ? "aspect-square" : "aspect-[4/3] max-h-[320px]";
  return (
    <>
      {proof.length > 0 && (
        <section aria-label="Your proof">
          <p className="mb-2 px-1 text-[14px] font-medium text-ink-muted">Your proof</p>
          <div className={`grid gap-2 ${proof.length > 1 ? "grid-cols-2" : ""}`}>
            {proof.map((p) =>
              p.type.startsWith("video/") ? (
                <video key={p.url} src={p.url} controls playsInline preload="metadata" className={`w-full rounded-[24px] bg-sunken object-cover shadow-card ${size}`} />
              ) : p.stills ? (
                // A wide strip of three stills, shown whole instead of cropped like a photo.
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.url} src={p.url} alt="Three stills from your video" className="w-full rounded-[24px] bg-sunken shadow-card" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.url} src={p.url} alt="Verified proof from this quest" className={`w-full rounded-[24px] bg-sunken object-cover shadow-card ${size}`} />
              ),
            )}
          </div>
        </section>
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
