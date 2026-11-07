// A person or crew as a soft gradient disc with their initial. The gradient is
// picked from the name, so the same person always looks the same.
const pairs = [
  ["#ffb59a", "#ff7a7a"],
  ["#ffd38a", "#f39a4c"],
  ["#a8e6b8", "#3fae95"],
  ["#9cc3ff", "#5d7dff"],
  ["#d6b4ff", "#9a7bff"],
  ["#ffc2dc", "#f07aa8"],
  ["#a6ecf0", "#3ea7c4"],
  ["#c9e89a", "#7fb04a"],
];

// FNV-1a, which spreads short names across the palette better than a plain sum.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Avatar({ name, size = 40, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const [a, b] = pairs[hash(name) % pairs.length];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.18)] ${ring ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4, background: `radial-gradient(circle at 30% 25%, rgb(255 255 255 / .45), transparent 45%), linear-gradient(145deg, ${a}, ${b})` }}
    >
      {name[0]?.toUpperCase()}
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
