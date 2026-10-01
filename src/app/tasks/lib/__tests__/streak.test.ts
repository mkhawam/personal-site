import { describe, expect, it } from "vitest";
import { calculateStreak } from "../streak";

const now = new Date(2026, 2, 10, 15, 0, 0); // local Mar 10 2026, mid-afternoon
const day = (d: string, tasksCompleted = 1) => ({ date: d, minutes: 25, tasksCompleted });

describe("calculateStreak", () => {
    it("is zero with no completions", () => {
        expect(calculateStreak([], now)).toBe(0);
        expect(calculateStreak([day("2026-03-10", 0)], now)).toBe(0);
    });

    it("counts consecutive days ending today", () => {
        expect(calculateStreak([day("2026-03-08"), day("2026-03-09"), day("2026-03-10")], now)).toBe(3);
    });

    it("still counts a streak that ended yesterday, so mornings don't reset it", () => {
        expect(calculateStreak([day("2026-03-08"), day("2026-03-09")], now)).toBe(2);
    });

    it("breaks on a gap", () => {
        expect(calculateStreak([day("2026-03-06"), day("2026-03-07"), day("2026-03-09"), day("2026-03-10")], now)).toBe(2);
        expect(calculateStreak([day("2026-03-07")], now)).toBe(0);
    });

    it("ignores days with focus minutes but no completed tasks", () => {
        expect(calculateStreak([day("2026-03-09", 0), day("2026-03-10")], now)).toBe(1);
    });
});
