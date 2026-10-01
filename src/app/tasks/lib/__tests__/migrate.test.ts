import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";
import type { Task } from "../../types";
import { migrateLoadedTasks } from "../migrate";

const now = new Date();
const d = (offset: number) => format(addDays(now, offset), "yyyy-MM-dd");
const task = (id: string, extra: Partial<Task> = {}): Task => ({ id, text: id, completed: false, subtasks: [], ...extra });

describe("migrateLoadedTasks", () => {
    it("back-fills listId", () => {
        expect(migrateLoadedTasks([task("a")], now)[0].listId).toBe("default");
    });

    it("drops tombstones older than 30 days and keeps fresh ones", () => {
        const old = task("old", { deletedAt: addDays(now, -31).toISOString() });
        const fresh = task("fresh", { deletedAt: addDays(now, -2).toISOString() });
        expect(migrateLoadedTasks([old, fresh], now).map((t) => t.id)).toEqual(["fresh"]);
    });

    it("resets a completed recurring task once its due date arrives, stamping updatedAt", () => {
        const due = task("r", { recurrence: "daily", completed: true, lastCompletedDate: d(-1), dueDate: d(0), actualPomos: 2, updatedAt: "2020-01-01T00:00:00Z" });
        const [out] = migrateLoadedTasks([due], now);
        expect(out.completed).toBe(false);
        expect(out.actualPomos).toBe(0);
        expect(out.updatedAt).not.toBe("2020-01-01T00:00:00Z");
    });

    it("leaves a completed recurring task alone before its next due date", () => {
        const notYet = task("r", { recurrence: "weekly", completed: true, lastCompletedDate: d(0), dueDate: d(7), updatedAt: "2020-01-01T00:00:00Z" });
        const [out] = migrateLoadedTasks([notYet], now);
        expect(out.completed).toBe(true);
        expect(out.updatedAt).toBe("2020-01-01T00:00:00Z"); // plain migration must not stamp
    });

    it("falls back to elapsed days for undated recurring tasks", () => {
        const weekly = task("w", { recurrence: "weekly", completed: true, lastCompletedDate: d(-7) });
        const daily = task("d", { recurrence: "daily", completed: true, lastCompletedDate: d(0) });
        const [w, dd] = migrateLoadedTasks([weekly, daily], now);
        expect(w.completed).toBe(false);
        expect(dd.completed).toBe(true);
    });
});
