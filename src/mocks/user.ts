import type { User } from "@/lib/contracts";

// Made-up people only. Never put real names, emails or locations in fixtures.
export const mockUser: User = {
  id: "00000000-0000-4000-8000-000000000001",
  display_name: "Sam",
  avatar_url: null,
  email_verified: true,
  coins: 240,
  created_at: "2026-11-01T17:00:00Z",
};

export const mockPartner = { display_name: "Priya", avatar_url: null };
export const mockPartnerId = "00000000-0000-4000-8000-000000000002";
