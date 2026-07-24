import { addDays, format, nextDay, type Day } from "date-fns";
import type { TaskTag } from "../types";

export type QuickAddResult = {
    text: string;
    priority?: "low" | "medium" | "high";
    tags?: string[];
    dueDate?: string; // yyyy-MM-dd
};

const PRIORITY_TOKENS: Record<string, "low" | "medium" | "high"> = {
    "!high": "high",
    "!h": "high",
    "!medium": "medium",
    "!med": "medium",
    "!m": "medium",
    "!low": "low",
    "!l": "low",
};

const WEEKDAYS: Record<string, Day> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function parseDueToken(token: string): string | undefined {
    if (token === "@today") return format(new Date(), "yyyy-MM-dd");
    if (token === "@tomorrow") return format(addDays(new Date(), 1), "yyyy-MM-dd");
    const weekday = WEEKDAYS[token.slice(1)];
    if (weekday !== undefined) return format(nextDay(new Date(), weekday), "yyyy-MM-dd");
    if (/^@\d{4}-\d{2}-\d{2}$/.test(token) && !isNaN(Date.parse(token.slice(1)))) return token.slice(1);
    return undefined;
}

/**
 * Quick-add syntax for the task input:
 *   `!high` / `!m` / `!low`  → priority
 *   `#work`                  → tag (matched against known tags; unknown #foo stays in the text)
 *   `@today` `@tomorrow` `@mon`..`@sun` `@2026-08-01` → due date
 * Recognized tokens are stripped from the task text.
 */
export function parseQuickAdd(raw: string, knownTags: TaskTag[]): QuickAddResult {
    const words = raw.trim().split(/\s+/);
    const textWords: string[] = [];
    let priority: QuickAddResult["priority"];
    let dueDate: string | undefined;
    const tags: string[] = [];

    for (const word of words) {
        const lower = word.toLowerCase();

        if (lower.startsWith("!") && PRIORITY_TOKENS[lower]) {
            priority = PRIORITY_TOKENS[lower];
            continue;
        }

        if (lower.startsWith("#") && lower.length > 1) {
            const name = lower.slice(1);
            const tag = knownTags.find((t) => t.id.toLowerCase() === name || t.label.toLowerCase() === name);
            if (tag) {
                if (!tags.includes(tag.id)) tags.push(tag.id);
                continue;
            }
            // unknown tag — keep it as text
        }

        if (lower.startsWith("@")) {
            const due = parseDueToken(lower);
            if (due) {
                dueDate = due;
                continue;
            }
        }

        textWords.push(word);
    }

    return {
        text: textWords.join(" "),
        priority,
        dueDate,
        tags: tags.length ? tags : undefined,
    };
}
