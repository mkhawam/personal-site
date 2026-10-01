import { describe, expect, it } from "vitest";
import { nextOccurrence } from "../dates";

describe("nextOccurrence", () => {
    it("advances one period when the task is on time", () => {
        expect(nextOccurrence("2026-03-10", "daily", "2026-03-10")).toBe("2026-03-11");
        expect(nextOccurrence("2026-03-10", "weekly", "2026-03-10")).toBe("2026-03-17");
        expect(nextOccurrence("2026-03-10", "monthly", "2026-03-10")).toBe("2026-04-10");
    });

    it("skips past every missed period so an overdue task lands in the future", () => {
        expect(nextOccurrence("2026-01-05", "weekly", "2026-03-10")).toBe("2026-03-16");
        expect(nextOccurrence("2025-11-30", "daily", "2026-03-10")).toBe("2026-03-11");
    });

    it("uses calendar months, including end-of-month clamping", () => {
        expect(nextOccurrence("2026-01-31", "monthly", "2026-01-31")).toBe("2026-02-28");
    });
});
