import type { ReactNode } from "react";

// How a tab page uses a wide screen. On a phone this is just the picture
// (the sky or a map) with the list under it, exactly as before. From 1024px
// up they sit side by side: the picture stays put on the left, filling the
// height, and the list scrolls on the right. The CSS for `.split-aside` in
// globals.css turns the sky's fade-out bottom into a rounded card there.
export function Split({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-8 lg:px-6">
      <div className="split-aside lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:py-6">{aside}</div>
      <div className="min-w-0 lg:py-6">{children}</div>
    </div>
  );
}
