import { describe, expect, it } from "vitest";
import { dueLabel, nextOccurrence } from "../dates";

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

describe("dueLabel", () => {
    // 2026-03-10 is a Tuesday
    const today = "2026-03-10";

    it("counts overdue days and names yesterday/today/tomorrow", () => {
        expect(dueLabel("2026-03-07", today)).toEqual({ text: "3d overdue", tone: "overdue" });
        expect(dueLabel("2026-03-09", today)).toEqual({ text: "Yesterday", tone: "overdue" });
        expect(dueLabel("2026-03-10", today)).toEqual({ text: "Today", tone: "today" });
        expect(dueLabel("2026-03-11", today)).toEqual({ text: "Tomorrow", tone: "soon" });
    });

    it("uses the weekday inside the coming week, then a short date", () => {
        expect(dueLabel("2026-03-13", today)).toEqual({ text: "Fri", tone: "soon" });
        expect(dueLabel("2026-03-17", today)).toEqual({ text: "Mar 17", tone: "later" });
        expect(dueLabel("2027-01-04", today)).toEqual({ text: "Jan 4, 2027", tone: "later" });
    });
});
