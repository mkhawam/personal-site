import type { Task, TaskList } from "../types";

const ts = (s?: string) => (s ? Date.parse(s) || 0 : 0);

/**
 * Per-task last-write-wins merge of a remote sync pull into local state.
 *
 * - Task present on both sides: newer updatedAt wins (tombstones included —
 *   a newer deletedAt beats an older edit, and a newer restore beats an
 *   already-synced tombstone).
 * - Remote-only task: kept (created on another device; local deletes leave
 *   tombstones, so absence here can only mean "new remote task").
 * - Local-only task: kept, prepended (created here since the last push —
 *   addTask prepends, so local-new-first matches app behavior).
 *
 * Ordering conflicts resolve to remote order with local-new on top; task
 * order carries no updatedAt (stamping on reorder would spam the merge).
 */
export function mergeTasks(local: Task[], remote: Task[]): Task[] {
    const localById = new Map(local.map((t) => [t.id, t]));
    const merged = remote.map((r) => {
        const l = localById.get(r.id);
        if (!l) return r;
        return ts(l.updatedAt) > ts(r.updatedAt) ? l : r;
    });
    const remoteIds = new Set(remote.map((t) => t.id));
    const localOnly = local.filter((t) => !remoteIds.has(t.id));
    return [...localOnly, ...merged];
}

/**
 * Union of lists by id; remote name wins for shared ids. No list tombstones —
 * a list deleted on one device can resurrect (empty, since its tasks are
 * tombstoned individually). Accepted trade-off for a rare event.
 */
export function mergeLists(local: TaskList[], remote: TaskList[]): TaskList[] {
    const remoteIds = new Set(remote.map((l) => l.id));
    const localOnly = local.filter((l) => !remoteIds.has(l.id));
    return [...remote, ...localOnly];
}
