import { format } from "date-fns";
import type { FocusHistoryEntry } from "../constants";

/**
 * Consecutive days (ending today or yesterday) with at least one task
 * completed. A day off yesterday breaks the streak; a quiet "today" does not,
 * so the badge doesn't vanish first thing in the morning. Local dates throughout.
 */
export function calculateStreak(focusHistory: FocusHistoryEntry[], now: Date = new Date()): number {
    const active = new Set(focusHistory.filter((h) => (h.tasksCompleted ?? 0) > 0).map((h) => h.date));
    if (active.size === 0) return 0;

    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const key = () => format(day, "yyyy-MM-dd");

    if (!active.has(key())) {
        day.setDate(day.getDate() - 1); // allow the streak to start from yesterday
        if (!active.has(key())) return 0;
    }

    let streak = 0;
    while (active.has(key())) {
        streak++;
        day.setDate(day.getDate() - 1);
    }
    return streak;
}
