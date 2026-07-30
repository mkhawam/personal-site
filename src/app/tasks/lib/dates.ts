import { addDays, addMonths, addWeeks, format } from "date-fns";

// The app's canonical date convention is a LOCAL yyyy-MM-dd string (quickAdd,
// TaskActionSheet, dueDate chips). Never use toISOString() for these — it is
// UTC and lands on the wrong date in the evening for western timezones.
export function localToday(): string {
    return format(new Date(), "yyyy-MM-dd");
}

const ADVANCE = {
    daily: (d: Date) => addDays(d, 1),
    weekly: (d: Date) => addWeeks(d, 1),
    monthly: (d: Date) => addMonths(d, 1),
} as const;

/**
 * Next occurrence of a recurring due date, strictly after today — completing a
 * long-overdue weekly task lands on the next FUTURE week, not another past date.
 */
export function nextOccurrence(dueDate: string, recurrence: keyof typeof ADVANCE, todayStr: string): string {
    let next = new Date(dueDate + "T00:00:00");
    const step = ADVANCE[recurrence];
    for (let i = 0; i < 500; i++) {
        next = step(next);
        const nextStr = format(next, "yyyy-MM-dd");
        if (nextStr > todayStr) return nextStr;
    }
    return format(next, "yyyy-MM-dd");
}
