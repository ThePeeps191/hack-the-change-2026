// Believable results for each kind of Claim zone, so one typo (or a judge
// typing -99999) can't take a zone forever. Shared by the form and the server.
const BOUNDS: Record<string, { min: number; max: number }> = {
  year: { min: 1000, max: new Date().getFullYear() },
  seconds: { min: 1, max: 3600 },
  snacks: { min: 0, max: 100 },
  posters: { min: 0, max: 300 },
};
const ANY = { min: 0, max: 10_000 };

export const claimBounds = (unit: string | null | undefined) => (unit && BOUNDS[unit]) || ANY;
