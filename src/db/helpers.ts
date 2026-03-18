import { nanoid } from "nanoid";
import type { Role } from "@/db/types";

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function generateSessionCode(): string {
  // 6 chars, easy to read/type: no 0/O, no 1/I/L, no 5/S, no 8/B
  const chars = "ACDEFGHJKMNPQRTUVWXY234679";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function now(): string {
  return new Date().toISOString();
}

export function buildRoles(
  n: number,
  customMafiaCount?: number,
  mode: "full" | "simple" = "full"
): Role[] {
  let mafiaCount: number;

  if (mode === "simple") {
    // Simple mode: just mafia vs civilians, no special roles
    if (customMafiaCount !== undefined && customMafiaCount >= 1 && customMafiaCount <= n - 1) {
      mafiaCount = customMafiaCount;
    } else {
      mafiaCount = Math.max(1, Math.floor(n / 3));
    }
    return [
      ...Array<Role>(mafiaCount).fill("mafia"),
      ...Array<Role>(n - mafiaCount).fill("civilian"),
    ];
  }

  // Full mode: mafia + detective + doctor + civilians
  if (customMafiaCount !== undefined && customMafiaCount >= 1 && customMafiaCount <= n - 3) {
    mafiaCount = customMafiaCount;
  } else {
    if (n <= 5) mafiaCount = 1;
    else if (n <= 8) mafiaCount = 2;
    else if (n <= 11) mafiaCount = 3;
    else mafiaCount = 4;
  }
  return [
    ...Array<Role>(mafiaCount).fill("mafia"),
    "detective",
    "doctor",
    ...Array<Role>(Math.max(0, n - mafiaCount - 2)).fill("civilian"),
  ];
}

// Re-export nanoid for convenience
export { nanoid };
