import { describe, expect, it } from "vitest";
import { mergeLists, mergeTasks } from "../merge";
import type { Task } from "../../types";

const task = (id: string, extra: Partial<Task> = {}): Task => ({ id, text: id, completed: false, subtasks: [], ...extra });

describe("mergeTasks", () => {
    it("keeps the newer side when a task exists on both", () => {
        const local = [task("a", { text: "local", updatedAt: "2026-01-02T00:00:00Z" })];
        const remote = [task("a", { text: "remote", updatedAt: "2026-01-01T00:00:00Z" })];
        expect(mergeTasks(local, remote)[0].text).toBe("local");
        expect(mergeTasks(remote, local)[0].text).toBe("local");
    });

    it("lets a newer tombstone beat an older edit, and a newer restore beat a tombstone", () => {
        const edited = task("a", { text: "edited", updatedAt: "2026-01-01T00:00:00Z" });
        const deleted = task("a", { deletedAt: "2026-01-02T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z" });
        expect(mergeTasks([edited], [deleted])[0].deletedAt).toBeDefined();

        const restored = task("a", { updatedAt: "2026-01-03T00:00:00Z" });
        expect(mergeTasks([deleted], [restored])[0].deletedAt).toBeUndefined();
    });

    it("keeps remote-only tasks and prepends local-only tasks", () => {
        const local = [task("new-local"), task("shared", { updatedAt: "2026-01-01T00:00:00Z" })];
        const remote = [task("shared", { updatedAt: "2026-01-01T00:00:00Z" }), task("remote-only")];
        expect(mergeTasks(local, remote).map((t) => t.id)).toEqual(["new-local", "shared", "remote-only"]);
    });

    it("treats a missing updatedAt as older than any stamped task", () => {
        const local = [task("a", { text: "unstamped" })];
        const remote = [task("a", { text: "stamped", updatedAt: "2026-01-01T00:00:00Z" })];
        expect(mergeTasks(local, remote)[0].text).toBe("stamped");
    });
});

describe("mergeLists", () => {
    it("unions by id with the remote name winning", () => {
        const merged = mergeLists(
            [
                { id: "default", name: "Local name" },
                { id: "only-local", name: "Mine" },
            ],
            [{ id: "default", name: "Remote name" }],
        );
        expect(merged).toEqual([
            { id: "default", name: "Remote name" },
            { id: "only-local", name: "Mine" },
        ]);
    });
});
