import type { ReactNode } from "react";

// How a page uses a wide screen. On a phone this is just the picture (the sky
// or a map) with the content under it, exactly as before. From 1024px up they
// sit side by side: the picture stays put on the left, filling the height, and
// the content scrolls on the right. The picture sits above the content (z-20)
// so the map can open over it. The CSS for `.split-aside` in globals.css turns
// the sky's fade-out bottom into a rounded card there.
// `fill` is for single-step pages (a recap, an invite): on a phone the content
// stretches to the bottom of the screen, so a button at its end stays low; on
// a computer the sky card fills the height and the content sits at the top.
export function Split({ aside, children, fill = false }: { aside: ReactNode; children: ReactNode; fill?: boolean }) {
  return (
    <div className={`lg:mx-auto lg:grid lg:w-full lg:max-w-[1120px] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-8 lg:px-6 ${fill ? "flex flex-1 flex-col" : ""}`}>
      <div className={`split-aside ${fill ? "split-tall" : ""} lg:sticky lg:top-0 lg:z-20 lg:flex lg:h-dvh lg:flex-col lg:py-6`}>{aside}</div>
      <div className={`min-w-0 lg:py-6 ${fill ? "flex flex-1 flex-col lg:block" : ""}`}>{children}</div>
    </div>
  );
}
