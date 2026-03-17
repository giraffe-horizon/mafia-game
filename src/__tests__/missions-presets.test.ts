import { describe, it, expect } from "vitest";
import { MISSION_PRESETS, type MissionPreset } from "@/lib/missions-presets";

describe("Mission Presets", () => {
  it("should export an array of mission presets", () => {
    expect(Array.isArray(MISSION_PRESETS)).toBe(true);
    expect(MISSION_PRESETS.length).toBeGreaterThan(0);
  });

  it("should have at least 20 presets", () => {
    expect(MISSION_PRESETS.length).toBeGreaterThanOrEqual(20);
  });

  it("should have valid structure for all presets", () => {
    MISSION_PRESETS.forEach((preset: MissionPreset, index: number) => {
      expect(typeof preset.description).toBe("string");
      expect(preset.description.length).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(preset.points);
      expect(["easy", "medium", "hard"]).toContain(preset.category);
    });
  });

  it("should have unique descriptions", () => {
    const descriptions = MISSION_PRESETS.map((p) => p.description);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(descriptions.length);
  });

  it("should have presets in all categories", () => {
    const categories = new Set(MISSION_PRESETS.map((p) => p.category));
    expect(categories.has("easy")).toBe(true);
    expect(categories.has("medium")).toBe(true);
    expect(categories.has("hard")).toBe(true);
  });

  it("should have presets with all point values", () => {
    const points = new Set(MISSION_PRESETS.map((p) => p.points));
    expect(points.has(1)).toBe(true);
    expect(points.has(2)).toBe(true);
    expect(points.has(3)).toBe(true);
  });

  it("should have easy presets worth 1 point", () => {
    const easyPresets = MISSION_PRESETS.filter((p) => p.category === "easy");
    easyPresets.forEach((p) => {
      expect(p.points).toBe(1);
    });
  });

  it("should have medium presets worth 2 points", () => {
    const mediumPresets = MISSION_PRESETS.filter((p) => p.category === "medium");
    mediumPresets.forEach((p) => {
      expect(p.points).toBe(2);
    });
  });

  it("should have hard presets worth 3 points", () => {
    const hardPresets = MISSION_PRESETS.filter((p) => p.category === "hard");
    hardPresets.forEach((p) => {
      expect(p.points).toBe(3);
    });
  });

  it("should have non-empty descriptions with reasonable length", () => {
    MISSION_PRESETS.forEach((preset) => {
      expect(preset.description.trim().length).toBeGreaterThan(5);
      expect(preset.description.length).toBeLessThan(300);
    });
  });
});
