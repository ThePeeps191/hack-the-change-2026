// A person or crew as a little squishy character, drawn as one inline SVG.
// How a character is built: we hash the name (FNV-1a) and read a few bits of
// that number to pick each part, so the same name always gives the same one.
//   body  - one of four soft blob outlines (mochi, gumdrop, bean, bun)
//   hue   - a body colour from `hues`; the .squish class in globals.css turns
//           it into a light fill and a deep outline, with a dark-mode version
//   eyes  - dots, shiny dots, happy ^^ or sleepy arcs
//   mouth - smile, little "o", cat "w" or a flat dash; blush on most of them
//   extra - nothing, a leaf sprout, ears or a tiny hat
// The body breathes with a slow squash and stretch (CSS, off for reduced
// motion), started at a different point per name so a list doesn't pulse in step.
const hues = [14, 32, 150, 220, 265, 335, 190, 95];

// FNV-1a, which spreads short names across the palette better than a plain sum.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Each body is a closed outline on a 100x100 canvas sitting on y=92, with
// `top` where its head is (for the extras) and `eye` the height of its face.
// The SVG shows only the 90x90 middle of that canvas, so the body fills the box.
const bodies = [
  { d: "M14 76C14 46 30 32 50 32S86 46 86 76C86 89 72 92 50 92S14 89 14 76Z", top: 32, eye: 60 }, // mochi
  { d: "M21 80C19 50 34 24 50 24S81 50 79 80C78 90 66 92 50 92S22 90 21 80Z", top: 24, eye: 58 }, // gumdrop
  { d: "M18 70C18 42 32 27 51 27S84 43 84 67C84 86 70 92 50 92S18 87 18 70Z", top: 27, eye: 57 }, // bean
  { d: "M11 74C11 50 28 38 50 38S89 50 89 74C89 89 74 92 50 92S11 89 11 74Z", top: 38, eye: 64 }, // bun
];

function Eyes({ kind, y }: { kind: number; y: number }) {
  if (kind === 0) return <><circle cx="38" cy={y} r="5.5" /><circle cx="62" cy={y} r="5.5" /></>;
  if (kind === 1)
    return (
      <>
        <circle cx="38" cy={y} r="7" /><circle cx="62" cy={y} r="7" />
        <circle cx="40.5" cy={y - 2.5} r="2.4" fill="#fff" /><circle cx="64.5" cy={y - 2.5} r="2.4" fill="#fff" />
      </>
    );
  // ^^ arcs bow up; sleepy arcs bow down.
  const bow = kind === 2 ? -7 : 6;
  return <path d={`M31 ${y + 2}q7 ${bow} 14 0M55 ${y + 2}q7 ${bow} 14 0`} fill="none" strokeWidth="5" />;
}

function Mouth({ kind, y }: { kind: number; y: number }) {
  if (kind === 0) return <path d={`M44 ${y}q6 6 12 0`} fill="none" strokeWidth="4.5" />;
  if (kind === 1) return <ellipse cx="50" cy={y + 1} rx="3.6" ry="4.2" />;
  if (kind === 2) return <path d={`M42 ${y}q4 5 8 0q4 5 8 0`} fill="none" strokeWidth="4" />;
  return <path d={`M45 ${y + 1}h10`} fill="none" strokeWidth="4.5" />;
}

function Extra({ kind, top }: { kind: number; top: number }) {
  if (kind === 1)
    return (
      <>
        <path d={`M50 ${top + 2}c0-5 1-9 3-12`} fill="none" stroke="hsl(105 35% 40%)" strokeWidth="4" />
        <path d={`M53 ${top - 10}c3-8 13-11 19-8c-3 7-12 11-19 8Z`} fill="hsl(105 45% 58%)" strokeWidth="3.5" />
      </>
    );
  if (kind === 3)
    return (
      <>
        <path d={`M38 ${top + 3}l3-12h18l3 12Z`} fill="var(--hat)" strokeWidth="3.5" />
        <path d={`M32 ${top + 3}h36`} fill="none" strokeWidth="5" />
      </>
    );
  return null;
}

export function Avatar({ name, size = 40, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const n = hash(name);
  // Each part reads its own slice of the hash, so parts vary independently.
  const h = hues[n % hues.length];
  const body = bodies[(n >>> 3) % bodies.length];
  const eyes = (n >>> 5) % 4;
  const mouth = (n >>> 7) % 4;
  const blush = (n >>> 9) % 4 !== 0;
  const extra = (n >>> 11) % 4;
  const delay = -((n >>> 13) % 30) / 10; // seconds into the 3s squish loop

  return (
    <span
      className={`squish inline-block shrink-0 rounded-full ${ring ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
      style={{ width: size, height: size, ["--h" as string]: h }}
    >
      <svg viewBox="5 8 90 90" width={size} height={size} aria-hidden className="block overflow-visible">
        <g className="squish-body" style={{ animationDelay: `${delay}s` }} stroke="var(--line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="var(--line)">
          {extra === 2 && (
            <>
              <circle cx="30" cy={body.top + 12} r="10" fill="var(--body)" />
              <circle cx="70" cy={body.top + 12} r="10" fill="var(--body)" />
            </>
          )}
          <path d={body.d} fill="var(--body)" />
          {/* A soft shine on the upper left, so it looks a little glossy. */}
          <ellipse cx="34" cy={body.top + 14} rx="7" ry="4.5" transform={`rotate(-30 34 ${body.top + 14})`} fill="#fff" stroke="none" opacity="0.55" />
          {blush && (
            <>
              <ellipse cx="27" cy={body.eye + 9} rx="6.5" ry="4" fill="var(--blush)" stroke="none" />
              <ellipse cx="73" cy={body.eye + 9} rx="6.5" ry="4" fill="var(--blush)" stroke="none" />
            </>
          )}
          <Eyes kind={eyes} y={body.eye} />
          <Mouth kind={mouth} y={body.eye + 10} />
          <Extra kind={extra} top={body.top} />
        </g>
      </svg>
    </span>
  );
}

// A little crown for whoever is on top this week.
export function Crown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d="M3.5 8.5l4.2 3.6L12 5l4.3 7.1 4.2-3.6-1.7 9.5H5.2z" fill="#f4c34f" stroke="#c9922a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.4 19.6h13.2" stroke="#c9922a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.3" fill="#fff3c8" />
    </svg>
  );
}
