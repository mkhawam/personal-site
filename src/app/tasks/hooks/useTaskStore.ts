"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { newId, TODAY_LIST_ID } from "../constants";
import { localToday, nextOccurrence } from "../lib/dates";
import { parseQuickAdd } from "../lib/quickAdd";
import { TASK_TAGS, type Task, type TaskList } from "../types";

type Options = {
    /** Gate for the persistence effect: nothing is written until the load effect ran. */
    isLoaded: boolean;
    /** A task just went from open to done (confetti, history, clear focus live in the page). */
    onTaskCompleted: (task: Task) => void;
};

/**
 * Tasks + lists + active list, their localStorage persistence, and every
 * mutation. All mutations are stable callbacks that read current state through
 * a ref, so memoized rows never re-render just because a handler changed.
 */
export function useTaskStore({ isLoaded, onTaskCompleted }: Options) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lists, setLists] = useState<TaskList[]>([{ id: "default", name: "My Tasks" }]);
    const [activeListId, setActiveListId] = useState<string>("default");

    const ref = useRef({ tasks, lists, activeListId, onTaskCompleted });
    ref.current = { tasks, lists, activeListId, onTaskCompleted };

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("my-tasks", JSON.stringify(tasks));
        localStorage.setItem("my-task-lists", JSON.stringify(lists));
        localStorage.setItem("active-list-id", activeListId);
    }, [tasks, lists, activeListId, isLoaded]);

    // Single mutation path for task edits: functional update (no stale closures)
    // + updatedAt stamp so the sync merge can do per-task last-write-wins.
    const touchTask = useCallback((id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, ...(typeof patch === "function" ? patch(t) : patch), updatedAt: new Date().toISOString() } : t,
            ),
        );
    }, []);

    const addTask = useCallback((text: string, initialSubtasks: string[] = []) => {
        if (!text.trim()) return;
        // Quick-add syntax: "#tag !high @tomorrow" tokens become task fields
        const parsed = parseQuickAdd(text, TASK_TAGS);
        if (!parsed.text) return;

        // Adding "to Today" means due today, filed in the default list
        const inToday = ref.current.activeListId === TODAY_LIST_ID;
        setTasks((prev) => [
            {
                id: newId(),
                text: parsed.text,
                completed: false,
                subtasks: initialSubtasks.map((t) => ({ id: newId(), text: t, completed: false })),
                priority: parsed.priority || "medium",
                tags: parsed.tags,
                dueDate: parsed.dueDate || (inToday ? localToday() : undefined),
                attachments: [],
                listId: inToday ? "default" : ref.current.activeListId,
                updatedAt: new Date().toISOString(),
            },
            ...prev,
        ]);
        toast.success("Task Added");
    }, []);

    const renameTask = useCallback(
        (id: string, text: string) => {
            const next = text.trim();
            const task = ref.current.tasks.find((t) => t.id === id);
            if (!task || !next || next === task.text) return;
            touchTask(id, { text: next });
            toast.success("Task updated");
        },
        [touchTask],
    );

    const toggleTask = useCallback(
        (id: string) => {
            const task = ref.current.tasks.find((t) => t.id === id);
            if (!task) return;
            const isCompleting = !task.completed;
            if (isCompleting) ref.current.onTaskCompleted(task);

            // LOCAL date — the load-time reset parses this as local, so a UTC
            // stamp would be off by one in the evening.
            const today = localToday();
            touchTask(id, (t) => ({
                completed: !t.completed,
                lastCompletedDate: isCompleting ? today : t.lastCompletedDate,
                // Completing a recurring task rolls its due date to the next future
                // occurrence (it leaves Today immediately). Un-completing does not
                // rewind; the same-day guard stops a toggle-off/on double advance.
                ...(isCompleting && t.recurrence && t.dueDate && t.lastCompletedDate !== today ?
                    { dueDate: nextOccurrence(t.dueDate, t.recurrence, today) }
                :   {}),
            }));
        },
        [touchTask],
    );

    const cyclePriority = useCallback(
        (id: string) =>
            touchTask(id, (t) => {
                const current = t.priority || "medium";
                return { priority: current === "low" ? "medium" : current === "medium" ? "high" : "low" };
            }),
        [touchTask],
    );

    const cycleRecurrence = useCallback(
        (id: string) => {
            const task = ref.current.tasks.find((t) => t.id === id);
            if (!task) return;
            const order: Task["recurrence"][] = [null, "daily", "weekly", "monthly"];
            const next = order[(order.indexOf(task.recurrence || null) + 1) % order.length];
            toast.info(`Recurrence: ${next ? next : "none"}`);
            touchTask(id, { recurrence: next });
        },
        [touchTask],
    );

    const toggleTag = useCallback(
        (taskId: string, tagId: string) =>
            touchTask(taskId, (t) => {
                const current = t.tags || [];
                return { tags: current.includes(tagId) ? current.filter((tag) => tag !== tagId) : [...current, tagId] };
            }),
        [touchTask],
    );

    // Fresh updatedAt so the restore beats an already-synced tombstone.
    const restoreTask = useCallback((id: string) => touchTask(id, { deletedAt: undefined }), [touchTask]);

    // Soft delete: tombstone instead of removing, so sync propagates the delete
    // instead of resurrecting the task, and Undo is always possible.
    const deleteTask = useCallback(
        (id: string) => {
            touchTask(id, { deletedAt: new Date().toISOString() });
            toast("Task Deleted", { action: { label: "Undo", onClick: () => restoreTask(id) } });
        },
        [touchTask, restoreTask],
    );

    const unarchiveTask = useCallback((id: string) => touchTask(id, { archived: false }), [touchTask]);
    const archiveTask = useCallback(
        (id: string) => {
            touchTask(id, { archived: true });
            toast("Task Archived", { action: { label: "Undo", onClick: () => unarchiveTask(id) } });
        },
        [touchTask, unarchiveTask],
    );

    const addSubtask = useCallback(
        (taskId: string, text: string) => {
            const clean = text.trim();
            if (!clean) return;
            touchTask(taskId, (t) => ({ subtasks: [...(t.subtasks || []), { id: newId(), text: clean, completed: false }] }));
        },
        [touchTask],
    );
    const toggleSubtask = useCallback(
        (taskId: string, subId: string) =>
            touchTask(taskId, (t) => ({ subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)) })),
        [touchTask],
    );
    const deleteSubtask = useCallback(
        (taskId: string, subId: string) => touchTask(taskId, (t) => ({ subtasks: (t.subtasks || []).filter((s) => s.id !== subId) })),
        [touchTask],
    );

    const addAttachment = useCallback(
        (taskId: string, url: string, name: string) => {
            const cleanUrl = url.trim();
            if (!cleanUrl) return;
            let label = name.trim();
            if (!label) {
                try {
                    label = new URL(cleanUrl).hostname;
                } catch {
                    label = "Link";
                }
            }
            touchTask(taskId, (t) => ({ attachments: [...(t.attachments || []), { id: newId(), name: label, url: cleanUrl, type: "link" as const }] }));
            toast.success("Link Attached");
        },
        [touchTask],
    );
    const deleteAttachment = useCallback(
        (taskId: string, attId: string) => touchTask(taskId, (t) => ({ attachments: (t.attachments || []).filter((a) => a.id !== attId) })),
        [touchTask],
    );

    const setNotes = useCallback((taskId: string, notes: string) => touchTask(taskId, { notes: notes.trim() }), [touchTask]);

    // Splice the reordered tasks back into their previous slots in the full
    // array — building it from the filtered views would drop every task outside
    // the current list/search. No updatedAt stamp: order is not per-task state,
    // and stamping all of them would spam the sync merge.
    const reorder = useCallback((newActiveTasks: Task[]) => {
        setTasks((prev) => {
            const ids = new Set(newActiveTasks.map((t) => t.id));
            let i = 0;
            return prev.map((t) => (ids.has(t.id) ? newActiveTasks[i++] : t));
        });
    }, []);

    // Explicit reorder for mobile (no drag gesture — it would fight swipe-x and scroll)
    const moveTask = useCallback((id: string, dir: -1 | 1) => {
        const listId = ref.current.activeListId;
        if (listId === TODAY_LIST_ID) return; // Today is due-date ordered; entry points are hidden
        setTasks((prev) => {
            const active = prev.filter((t) => !t.deletedAt && (t.listId || "default") === listId && !t.completed && !t.archived);
            const idx = active.findIndex((t) => t.id === id);
            const swapWith = active[idx + dir];
            if (idx === -1 || !swapWith) return prev;
            const i1 = prev.findIndex((t) => t.id === id);
            const i2 = prev.findIndex((t) => t.id === swapWith.id);
            const next = [...prev];
            [next[i1], next[i2]] = [next[i2], next[i1]];
            return next;
        });
    }, []);

    const createList = useCallback((name: string) => {
        const clean = name.trim();
        if (!clean) return;
        const id = Date.now().toString(36);
        setLists((prev) => [...prev, { id, name: clean }]);
        setActiveListId(id);
        toast.success(`Created "${clean}"`);
    }, []);

    const deleteList = useCallback((id: string) => {
        if (id === "default") return;
        const list = ref.current.lists.find((l) => l.id === id);
        if (!list) return;

        // Soft delete with Undo (the app's convention) instead of a blocking confirm().
        // Tombstone the list's tasks — a hard filter would let sync resurrect them.
        const now = new Date().toISOString();
        const affected = new Set(ref.current.tasks.filter((t) => t.listId === id && !t.deletedAt).map((t) => t.id));
        setLists((prev) => prev.filter((l) => l.id !== id));
        setTasks((prev) => prev.map((t) => (affected.has(t.id) ? { ...t, deletedAt: now, updatedAt: now } : t)));
        if (ref.current.activeListId === id) setActiveListId("default");

        toast(`Deleted "${list.name}"`, {
            description: affected.size ? `${affected.size} task${affected.size === 1 ? "" : "s"} moved to Recently Deleted` : undefined,
            action: {
                label: "Undo",
                onClick: () => {
                    const restoredAt = new Date().toISOString();
                    setLists((prev) => (prev.some((l) => l.id === id) ? prev : [...prev, list]));
                    setTasks((prev) => prev.map((t) => (affected.has(t.id) ? { ...t, deletedAt: undefined, updatedAt: restoredAt } : t)));
                    setActiveListId(id);
                },
            },
        });
    }, []);

    const hydrate = useCallback((d: { tasks?: Task[]; lists?: TaskList[]; activeListId?: string }) => {
        if (d.tasks) setTasks(d.tasks);
        if (d.lists) setLists(d.lists);
        if (d.activeListId) setActiveListId(d.activeListId);
    }, []);

    // One stable object: memoized rows take it as a single prop.
    const actions = useMemo(
        () => ({
            touchTask,
            addTask,
            renameTask,
            toggleTask,
            cyclePriority,
            cycleRecurrence,
            toggleTag,
            deleteTask,
            restoreTask,
            archiveTask,
            unarchiveTask,
            addSubtask,
            toggleSubtask,
            deleteSubtask,
            addAttachment,
            deleteAttachment,
            setNotes,
            reorder,
            moveTask,
            createList,
            deleteList,
        }),
        [
            touchTask,
            addTask,
            renameTask,
            toggleTask,
            cyclePriority,
            cycleRecurrence,
            toggleTag,
            deleteTask,
            restoreTask,
            archiveTask,
            unarchiveTask,
            addSubtask,
            toggleSubtask,
            deleteSubtask,
            addAttachment,
            deleteAttachment,
            setNotes,
            reorder,
            moveTask,
            createList,
            deleteList,
        ],
    );

    return { tasks, lists, activeListId, setTasks, setLists, setActiveListId, hydrate, actions };
}

export type TaskActions = ReturnType<typeof useTaskStore>["actions"];
