import { addDays, addMonths, addWeeks, differenceInCalendarDays, format } from "date-fns";

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

export type DueTone = "overdue" | "today" | "soon" | "later";

/**
 * Human label for a due chip, relative to today: "3d overdue", "Yesterday",
 * "Today", "Tomorrow", a weekday within the coming week, else "Nov 14"
 * (with the year only when it differs).
 */
export function dueLabel(dueDate: string, todayStr: string): { text: string; tone: DueTone } {
    const due = new Date(dueDate + "T00:00:00");
    const today = new Date(todayStr + "T00:00:00");
    const days = differenceInCalendarDays(due, today);
    if (days < -1) return { text: `${-days}d overdue`, tone: "overdue" };
    if (days === -1) return { text: "Yesterday", tone: "overdue" };
    if (days === 0) return { text: "Today", tone: "today" };
    if (days === 1) return { text: "Tomorrow", tone: "soon" };
    if (days < 7) return { text: format(due, "EEE"), tone: "soon" };
    return { text: format(due, due.getFullYear() === today.getFullYear() ? "MMM d" : "MMM d, yyyy"), tone: "later" };
}
