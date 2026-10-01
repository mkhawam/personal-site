import { localToday } from "./dates";
import type { Task } from "../types";

// Tombstones older than this have propagated to any other device by now
const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Normalises tasks loaded from localStorage (or a backup): drops expired
 * tombstones, back-fills listId, and resets recurring tasks whose next period
 * has arrived. Pure, so it can be tested with a fixed `now`.
 */
export function migrateLoadedTasks(loaded: Task[], now: Date = new Date()): Task[] {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStr = localToday();

    return loaded
        .filter((t) => !t.deletedAt || now.getTime() - new Date(t.deletedAt).getTime() < TOMBSTONE_TTL_MS)
        .map((t) => {
            let task: Task = { ...t, listId: t.listId || "default" };

            if (task.recurrence && task.completed && task.lastCompletedDate) {
                const lastCompleted = new Date(task.lastCompletedDate + "T00:00:00");
                const daysSince = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

                let shouldReset = false;
                if (task.dueDate) {
                    // dueDate advanced to the next occurrence at completion, so
                    // "due date arrived" IS the next-period trigger — and it handles
                    // monthly correctly (calendar month, not 30d).
                    shouldReset = task.dueDate <= todayStr;
                } else {
                    if (task.recurrence === "daily" && daysSince >= 1) shouldReset = true;
                    if (task.recurrence === "weekly" && daysSince >= 7) shouldReset = true;
                    if (task.recurrence === "monthly" && daysSince >= 30) shouldReset = true;
                }

                if (shouldReset) {
                    // Real data change — stamp it so the reset wins the sync merge.
                    // The plain migration above must NOT stamp, or every load would
                    // look like a local edit.
                    task = { ...task, completed: false, actualPomos: 0, updatedAt: now.toISOString() };
                }
            }
            return task;
        });
}
