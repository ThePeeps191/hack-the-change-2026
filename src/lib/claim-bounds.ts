// Believable results for each kind of Claim zone, so one typo (or a judge
// typing -99999) can't take a zone forever. Shared by the form and the server.
const BOUNDS: Record<string, { min: number; max: number }> = {
  year: { min: 1000, max: new Date().getFullYear() },
  seconds: { min: 1, max: 3600 },
  snacks: { min: 0, max: 100 },
  posters: { min: 0, max: 300 },
};
const ANY = { min: 0, max: 10_000 };

// A zone's unit in plain words: "|price - $20.26|" (how far a price is from
// $20.26) reads as "dollars off $20.26". Other units ("year", "seconds") as they are.
export function unitLabel(unit: string | null | undefined) {
  const off = unit?.match(/^\|price - (\$[\d.]+)\|$/);
  return off ? `dollars off ${off[1]}` : (unit ?? "");
}

// A zone's best result as a short phrase: "$4 off $20.26", "38 seconds".
export function resultLabel(n: number, unit: string | null | undefined) {
  const off = unit?.match(/^\|price - (\$[\d.]+)\|$/);
  return off ? `$${n} off ${off[1]}` : `${n} ${unit ?? ""}`.trim();
}

export const claimBounds = (unit: string | null | undefined) => (unit && BOUNDS[unit]) || ANY;
