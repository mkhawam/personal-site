"use client";

import { useState } from "react";
import clsx from "clsx";
import { addDays, addWeeks, format } from "date-fns";
import { Archive, CornerDownRight, FileText, Flame, FolderInput, Paperclip, Pencil, Repeat, Tag } from "lucide-react";
import { toast } from "sonner";
import type { ModalType } from "../constants";
import type { TaskActions } from "../hooks/useTaskStore";
import { TASK_TAGS, type Task, type TaskList } from "../types";
import AnchorPopover from "./AnchorPopover";
import type { PopoverType } from "./DesktopTaskRow";
import TaskTagsMenu from "./TaskTagsMenu";

export type PopoverState = { type: PopoverType; taskId: string; anchorEl: HTMLElement } | null;

type Props = {
    popover: PopoverState;
    tasks: Task[];
    lists: TaskList[];
    actions: TaskActions;
    onClose: () => void;
    onSwitch: (type: PopoverType) => void;
    onRename: (id: string) => void;
    onOpenModal: (type: ModalType, taskId: string) => void;
};

/** Desktop anchored editors (due date / move / estimate / ⋯ menu) plus the tag picker they hand off to. */
export default function TaskPopovers({ popover, tasks, lists, actions, onClose, onSwitch, onRename, onOpenModal }: Props) {
    const [tagMenu, setTagMenu] = useState<{ taskId: string; anchorEl: HTMLElement } | null>(null);
    const task = (popover && tasks.find((t) => t.id === popover.taskId && !t.deletedAt)) || null;
    const tagTask = (tagMenu && tasks.find((t) => t.id === tagMenu.taskId && !t.deletedAt)) || null;

    const menuItems =
        popover && task ?
            [
                { icon: <Pencil size={14} />, label: "Rename", run: () => onRename(task.id) },
                { icon: <CornerDownRight size={14} />, label: "Add subtask", run: () => onOpenModal("SUBTASK", task.id) },
                { icon: <FileText size={14} />, label: task.notes ? "Edit notes" : "Add notes", run: () => onOpenModal("NOTE", task.id) },
                { icon: <Paperclip size={14} />, label: "Attach link", run: () => onOpenModal("ATTACHMENT", task.id) },
                // Hand the same anchor to the tag picker so it opens where the menu was
                { icon: <Tag size={14} />, label: "Tags", run: () => setTagMenu({ taskId: task.id, anchorEl: popover.anchorEl }) },
                { icon: <Repeat size={14} />, label: `Repeat: ${task.recurrence ?? "none"}`, keep: true, run: () => actions.cycleRecurrence(task.id) },
                { icon: <Flame size={14} />, label: "Pomodoro estimate", keep: true, run: () => onSwitch("estimate") },
                ...(lists.length > 1 ? [{ icon: <FolderInput size={14} />, label: "Move to list", keep: true, run: () => onSwitch("move") }] : []),
                { icon: <Archive size={14} />, label: "Archive", run: () => actions.archiveTask(task.id) },
            ]
        :   [];

    return (
        <>
            <AnchorPopover
                open={!!popover && !!task}
                anchorEl={popover?.anchorEl ?? null}
                onClose={onClose}
                width={popover?.type === "due" ? 260 : popover?.type === "more" ? 216 : 220}
                maxHeight={320}
            >
                {popover?.type === "due" && task && (
                    <div className="space-y-2 p-1">
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: "Today", value: format(new Date(), "yyyy-MM-dd") },
                                { label: "Tomorrow", value: format(addDays(new Date(), 1), "yyyy-MM-dd") },
                                { label: "Next week", value: format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
                            ].map((c) => (
                                <button
                                    key={c.label}
                                    onClick={() => {
                                        actions.touchTask(task.id, { dueDate: c.value });
                                        onClose();
                                    }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        task.dueDate === c.value ? "bg-primary text-primary-content" : "bg-base-content/5 text-base-content/70 hover:bg-base-content/10",
                                    )}
                                >
                                    {c.label}
                                </button>
                            ))}
                            {task.dueDate && (
                                <button
                                    onClick={() => {
                                        actions.touchTask(task.id, { dueDate: undefined });
                                        onClose();
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-base-content/5 text-error hover:bg-error/10"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <input
                            type="date"
                            value={task.dueDate || ""}
                            onChange={(e) => actions.touchTask(task.id, { dueDate: e.target.value || undefined })}
                            className="w-full bg-base-300/40 text-sm text-base-content border border-base-content/10 rounded-lg p-2 focus:outline-none focus:border-base-content/40"
                            aria-label="Due date"
                        />
                    </div>
                )}

                {popover?.type === "move" && task && (
                    <div className="space-y-1">
                        {lists
                            .filter((l) => l.id !== (task.listId || "default"))
                            .map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => {
                                        actions.touchTask(task.id, { listId: list.id });
                                        onClose();
                                        toast.success(`Moved to "${list.name}"`);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:bg-base-content/5 hover:text-base-content flex items-center gap-2"
                                >
                                    <FolderInput size={14} className="text-base-content/50" />
                                    {list.name}
                                </button>
                            ))}
                    </div>
                )}

                {popover?.type === "estimate" && task && (
                    <div className="flex items-center justify-between gap-2 p-1">
                        <button
                            onClick={() => actions.touchTask(task.id, { estimatedPomos: Math.max(0, (task.estimatedPomos || 0) - 1) || undefined })}
                            className="w-9 h-9 rounded-lg bg-base-content/5 hover:bg-base-content/10 text-base-content text-lg font-bold"
                            aria-label="Decrease estimate"
                        >
                            −
                        </button>
                        <div className="text-sm font-mono text-base-content">
                            🍅 {task.actualPomos || 0}/{task.estimatedPomos || "?"}
                        </div>
                        <button
                            onClick={() => actions.touchTask(task.id, { estimatedPomos: (task.estimatedPomos || 0) + 1 })}
                            className="w-9 h-9 rounded-lg bg-base-content/5 hover:bg-base-content/10 text-base-content text-lg font-bold"
                            aria-label="Increase estimate"
                        >
                            +
                        </button>
                    </div>
                )}

                {popover?.type === "more" && task && (
                    <div className="space-y-0.5" role="menu" aria-label="Task actions">
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                role="menuitem"
                                onClick={() => {
                                    item.run();
                                    if (!("keep" in item && item.keep)) onClose();
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:bg-base-content/5 hover:text-base-content flex items-center gap-2.5"
                            >
                                <span className="text-base-content/50">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </AnchorPopover>

            <TaskTagsMenu
                open={!!tagTask}
                anchorEl={tagTask ? tagMenu!.anchorEl : null}
                tags={TASK_TAGS}
                selectedTagIds={tagTask?.tags ?? []}
                onToggleTag={(tagId) => tagTask && actions.toggleTag(tagTask.id, tagId)}
                onClose={() => setTagMenu(null)}
            />
        </>
    );
}
