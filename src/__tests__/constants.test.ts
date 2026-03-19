import { describe, it, expect } from "vitest";
import { positionColor, autoMafiaCount } from "@/lib/constants";

describe("positionColor", () => {
  it("returns gold for 1st place (index 0)", () => {
    expect(positionColor(0)).toBe("text-amber-400");
  });

  it("returns silver for 2nd place (index 1)", () => {
    expect(positionColor(1)).toBe("text-slate-300");
  });

  it("returns bronze for 3rd place (index 2)", () => {
    expect(positionColor(2)).toBe("text-orange-400");
  });

  it("returns default color for 4th place (index 3)", () => {
    expect(positionColor(3)).toBe("text-slate-500");
  });

  it("returns default color for any index beyond 3", () => {
    expect(positionColor(4)).toBe("text-slate-500");
    expect(positionColor(10)).toBe("text-slate-500");
    expect(positionColor(100)).toBe("text-slate-500");
  });
});

describe("autoMafiaCount", () => {
  it("returns 1 mafia for 3 players", () => {
    expect(autoMafiaCount(3)).toBe(1);
  });

  it("returns 1 mafia for 5 players", () => {
    expect(autoMafiaCount(5)).toBe(1);
  });

  it("returns 2 mafia for 6 players", () => {
    expect(autoMafiaCount(6)).toBe(2);
  });

  it("returns 2 mafia for 8 players", () => {
    expect(autoMafiaCount(8)).toBe(2);
  });

  it("returns 3 mafia for 9 players", () => {
    expect(autoMafiaCount(9)).toBe(3);
  });

  it("returns 3 mafia for 11 players", () => {
    expect(autoMafiaCount(11)).toBe(3);
  });

  it("returns 4 mafia for 12 players", () => {
    expect(autoMafiaCount(12)).toBe(4);
  });

  it("returns 4 mafia for large groups", () => {
    expect(autoMafiaCount(20)).toBe(4);
  });
});

// errors.ts tests
import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage", () => {
  it("extracts message from Error instance", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns fallback for non-Error values", () => {
    expect(getErrorMessage("string")).toBe("Błąd połączenia");
    expect(getErrorMessage(null)).toBe("Błąd połączenia");
    expect(getErrorMessage(42)).toBe("Błąd połączenia");
  });

  it("uses custom fallback", () => {
    expect(getErrorMessage("nope", "custom")).toBe("custom");
  });
});
