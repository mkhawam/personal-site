import { addDays, format, nextDay } from "date-fns";
import { describe, expect, it } from "vitest";
import { TASK_TAGS } from "../../types";
import { parseQuickAdd } from "../quickAdd";

const today = () => format(new Date(), "yyyy-MM-dd");

describe("parseQuickAdd", () => {
    it("returns plain text untouched", () => {
        expect(parseQuickAdd("Buy milk", TASK_TAGS)).toEqual({ text: "Buy milk", priority: undefined, dueDate: undefined, tags: undefined });
    });

    it("strips priority tokens in any supported spelling", () => {
        expect(parseQuickAdd("Ship it !high", TASK_TAGS).priority).toBe("high");
        expect(parseQuickAdd("Ship it !H", TASK_TAGS).priority).toBe("high");
        expect(parseQuickAdd("Ship it !med", TASK_TAGS).priority).toBe("medium");
        expect(parseQuickAdd("Ship it !l", TASK_TAGS).priority).toBe("low");
        expect(parseQuickAdd("Ship it !high", TASK_TAGS).text).toBe("Ship it");
    });

    it("matches known tags by id or label and keeps unknown hashtags as text", () => {
        const r = parseQuickAdd("Write post #Work #ideas #unknown", TASK_TAGS);
        expect(r.tags).toEqual(["work", "ideas"]);
        expect(r.text).toBe("Write post #unknown");
    });

    it("does not duplicate a tag given twice", () => {
        expect(parseQuickAdd("x #work #work", TASK_TAGS).tags).toEqual(["work"]);
    });

    it("parses relative and absolute due dates", () => {
        expect(parseQuickAdd("a @today", TASK_TAGS).dueDate).toBe(today());
        expect(parseQuickAdd("a @tomorrow", TASK_TAGS).dueDate).toBe(format(addDays(new Date(), 1), "yyyy-MM-dd"));
        expect(parseQuickAdd("a @fri", TASK_TAGS).dueDate).toBe(format(nextDay(new Date(), 5), "yyyy-MM-dd"));
        expect(parseQuickAdd("a @2026-12-25", TASK_TAGS).dueDate).toBe("2026-12-25");
    });

    it("keeps unrecognised @ and ! words as text", () => {
        const r = parseQuickAdd("email @alice about !!!", TASK_TAGS);
        expect(r.text).toBe("email @alice about !!!");
        expect(r.dueDate).toBeUndefined();
        expect(r.priority).toBeUndefined();
    });

    it("yields empty text when only tokens are given", () => {
        expect(parseQuickAdd("#work !high @today", TASK_TAGS).text).toBe("");
    });
});
