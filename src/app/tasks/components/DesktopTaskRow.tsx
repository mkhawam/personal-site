"use client";

import { memo } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { Calendar, Check, Flag, GripVertical, ListChecks, MoreHorizontal, Plus, Repeat, Target, Timer, Trash2, X } from "lucide-react";
import { dueLabel, type DueTone } from "../lib/dates";
import { getIconForUrl } from "../lib/attachmentIcon";
import { TASK_TAGS, type Task } from "../types";

export type PopoverType = "due" | "move" | "estimate" | "more";

/** Every handler a row can fire. One stable object so memoized rows stay memoized. */
export type RowActions = {
    toggle: (id: string) => void;
    rename: (id: string, text: string) => void;
    startEdit: (id: string) => void;
    stopEdit: () => void;
    cyclePriority: (id: string) => void;
    cycleRecurrence: (id: string) => void;
    openPopover: (type: PopoverType, id: string, anchorEl: HTMLElement) => void;
    toggleFocus: (id: string) => void;
    remove: (id: string) => void;
    toggleSubtask: (id: string, subId: string) => void;
    deleteSubtask: (id: string, subId: string) => void;
    addSubtask: (id: string, text: string) => void;
    deleteAttachment: (id: string, attId: string) => void;
    openAttachment: (id: string) => void;
};

type Props = {
    task: Task;
    /** Shown in the cross-list Today view */
    listName?: string;
    todayStr: string;
    reorderDisabled: boolean;
    isFocused: boolean;
    isEditing: boolean;
    isMenuOpen: boolean;
    actions: RowActions;
};

// Priority lives on the checkbox ring, so the row needs no always-on flag.
const ringClass = (p?: string) =>
    p === "high" ? "border-error"
    : p === "low" ? "border-base-content/20"
    : "border-base-content/40";

const DUE_TONE: Record<DueTone, string> = {
    overdue: "bg-error/12 text-error",
    today: "bg-warning/15 text-warning",
    soon: "bg-base-content/6 text-base-content/80",
    later: "bg-base-content/6 text-base-content/60",
};

const RECURRENCE_TONE = { daily: "bg-info/10 text-info", weekly: "bg-secondary/10 text-secondary", monthly: "bg-success/10 text-success" } as const;

const META_CHIP = "inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[11px] font-medium leading-none transition-colors";
const ACTION_BTN = "p-1.5 rounded-md transition-colors";
// Hidden until hover/keyboard focus on mouse devices; touch tablets keep them visible.
const REVEAL = "pointer-fine:opacity-0 pointer-fine:group-hover/row:opacity-100 pointer-fine:group-focus-within/row:opacity-100 transition-opacity";

function DesktopTaskRow({ task, listName, todayStr, reorderDisabled, isFocused, isEditing, isMenuOpen, actions }: Props) {
    const hasSubtasks = !!task.subtasks && task.subtasks.length > 0;
    const doneSubtasks = hasSubtasks ? task.subtasks.filter((s) => s.completed).length : 0;
    const due = task.dueDate ? dueLabel(task.dueDate, todayStr) : null;
    const tags = (task.tags ?? []).map((id) => TASK_TAGS.find((t) => t.id === id)).filter((t) => !!t);
    const hasMeta = !!(listName || due || task.recurrence || task.estimatedPomos || task.actualPomos || hasSubtasks || tags.length);

    return (
        <Reorder.Item
            value={task}
            dragListener={!reorderDisabled}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.2, ease: "easeInOut" as const }}
            className={clsx(
                "group/row relative flex flex-col px-2 py-2.5 rounded-xl transition-colors",
                isFocused ? "bg-warning/8 ring-1 ring-inset ring-warning/35" : "hover:bg-base-content/4",
            )}
        >
            <div className="flex items-start gap-2.5">
                {/* Grip slot is always reserved so titles line up whether or not reordering is on */}
                <div
                    className={clsx(
                        "w-4 h-6 flex items-center justify-center shrink-0 text-base-content/40",
                        reorderDisabled ? "invisible" : "cursor-grab active:cursor-grabbing hover:text-base-content/70 " + REVEAL,
                    )}
                    aria-hidden
                >
                    <GripVertical size={14} />
                </div>

                <button
                    onClick={() => actions.toggle(task.id)}
                    className={clsx(
                        "group/check mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 hover:border-success hover:bg-success/10",
                        ringClass(task.priority),
                    )}
                    aria-label="Mark complete"
                    title={`Mark complete · ${task.priority ?? "medium"} priority`}
                >
                    <Check size={12} strokeWidth={3} className="text-success opacity-0 group-hover/check:opacity-100 transition-opacity" />
                </button>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {isEditing ?
                        <input
                            type="text"
                            defaultValue={task.text}
                            autoFocus
                            onBlur={(e) => {
                                actions.rename(task.id, e.target.value);
                                actions.stopEdit();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                if (e.key === "Escape") actions.stopEdit();
                            }}
                            className="w-full text-base leading-6 font-medium text-base-content bg-transparent border-b border-primary outline-none"
                        />
                    :   <span
                            onDoubleClick={() => actions.startEdit(task.id)}
                            className="w-full text-base leading-6 font-medium select-none truncate text-base-content cursor-text block"
                            title="Double-click to edit"
                        >
                            {task.text}
                        </span>
                    }

                    {hasMeta && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {due && (
                                <button
                                    onClick={(e) => actions.openPopover("due", task.id, e.currentTarget)}
                                    className={clsx(META_CHIP, DUE_TONE[due.tone], "hover:brightness-110")}
                                    title={`Due ${new Date(task.dueDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`}
                                >
                                    <Calendar size={11} />
                                    {due.text}
                                </button>
                            )}
                            {task.recurrence && (
                                <button
                                    onClick={() => actions.cycleRecurrence(task.id)}
                                    className={clsx(META_CHIP, "hover:brightness-110", RECURRENCE_TONE[task.recurrence])}
                                    title={`Repeats ${task.recurrence} — click to cycle`}
                                >
                                    <Repeat size={11} />
                                    {task.recurrence}
                                </button>
                            )}
                            {/* Pomodoro count — only once an estimate or a logged session exists */}
                            {task.estimatedPomos || task.actualPomos ?
                                <button
                                    onClick={(e) => actions.openPopover("estimate", task.id, e.currentTarget)}
                                    className={clsx(META_CHIP, "first:pl-0 text-base-content/60 hover:text-base-content tabular-nums")}
                                    title={`${task.actualPomos || 0} of ${task.estimatedPomos || "?"} pomodoros — click to set estimate`}
                                >
                                    <Timer size={11} />
                                    {task.actualPomos || 0}/{task.estimatedPomos || "?"}
                                </button>
                            :   null}
                            {hasSubtasks && (
                                <span
                                    className={clsx(META_CHIP, "first:pl-0 tabular-nums", doneSubtasks === task.subtasks.length ? "text-success" : "text-base-content/60")}
                                    title={`${doneSubtasks} of ${task.subtasks.length} subtasks done`}
                                >
                                    <ListChecks size={11} />
                                    {doneSubtasks}/{task.subtasks.length}
                                </span>
                            )}
                            {listName && <span className={clsx(META_CHIP, "text-base-content/50 border border-base-content/10")}>{listName}</span>}
                            {tags.map((tag) => (
                                <span key={tag.id} className={clsx(META_CHIP, "border", tag.chip)}>
                                    {tag.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-0.5 items-center shrink-0 -my-0.5 text-base-content/50">
                    <button
                        onClick={() => actions.cyclePriority(task.id)}
                        className={clsx(
                            ACTION_BTN,
                            "hover:bg-base-content/8",
                            task.priority === "high" ? "text-error" : "hover:text-base-content",
                            task.priority !== "high" && REVEAL,
                        )}
                        title={`Priority: ${task.priority || "medium"} — click to cycle`}
                    >
                        <Flag size={15} fill={task.priority === "high" ? "currentColor" : "none"} />
                    </button>

                    {!task.dueDate && (
                        <button
                            onClick={(e) => actions.openPopover("due", task.id, e.currentTarget)}
                            className={clsx(ACTION_BTN, "hover:text-base-content hover:bg-base-content/8", REVEAL)}
                            title="Set due date"
                        >
                            <Calendar size={15} />
                        </button>
                    )}

                    <button
                        onClick={() => actions.toggleFocus(task.id)}
                        className={clsx(ACTION_BTN, isFocused ? "text-warning bg-warning/15" : clsx("hover:text-warning hover:bg-base-content/8", REVEAL))}
                        title={isFocused ? "Stop focusing" : "Focus on this task"}
                    >
                        <Target size={15} />
                    </button>

                    {/* Everything else (rename, subtask, notes, link, tags, repeat, estimate, move, archive) */}
                    <button
                        onClick={(e) => actions.openPopover("more", task.id, e.currentTarget)}
                        className={clsx(ACTION_BTN, isMenuOpen ? "text-base-content bg-base-content/10" : clsx("hover:text-base-content hover:bg-base-content/8", REVEAL))}
                        title="More actions"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                    >
                        <MoreHorizontal size={15} />
                    </button>

                    <button onClick={() => actions.remove(task.id)} className={clsx(ACTION_BTN, "hover:text-error hover:bg-error/10", REVEAL)} title="Delete">
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {task.notes && (
                <div className="pl-14 pr-8 mt-1.5 text-sm text-base-content/65 prose prose-sm max-w-none prose-p:my-1">
                    <ReactMarkdown>{task.notes}</ReactMarkdown>
                </div>
            )}

            {/* Subtasks — only once a task has some; a bare task gets "Add subtask" from the ⋯ menu */}
            {hasSubtasks && (
                <div className="pl-14 pr-2 space-y-1.5 mt-2">
                    <AnimatePresence>
                        {task.subtasks.map((sub) => (
                            <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="group/sub flex items-center gap-2.5 text-sm"
                            >
                                <button
                                    onClick={() => actions.toggleSubtask(task.id, sub.id)}
                                    className="p-1.5 -m-1.5 flex items-center justify-center flex-shrink-0"
                                    aria-label={sub.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                                >
                                    <span
                                        className={clsx(
                                            "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                                            sub.completed ? "bg-success border-success" : "border-base-content/30 hover:border-success",
                                        )}
                                    >
                                        {sub.completed && <Check size={10} strokeWidth={3} className="text-success-content" />}
                                    </span>
                                </button>
                                <span className={clsx("flex-1 text-base-content/75 transition-colors", sub.completed && "line-through text-base-content/35")}>
                                    {sub.text}
                                </span>
                                <button
                                    onClick={() => actions.deleteSubtask(task.id, sub.id)}
                                    className="p-1 text-base-content/40 hover:text-error transition-colors pointer-fine:opacity-0 pointer-fine:group-hover/sub:opacity-100 focus:opacity-100"
                                    aria-label="Delete subtask"
                                >
                                    <X size={13} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <label className={clsx("flex items-center gap-2.5 text-sm text-base-content/40 focus-within:text-base-content/70", REVEAL)}>
                        <Plus size={14} className="shrink-0" />
                        <input
                            type="text"
                            placeholder="Add subtask"
                            className="flex-1 bg-transparent text-base-content/80 placeholder:text-base-content/40 outline-none text-sm"
                            onKeyDown={(e) => {
                                const input = e.target as HTMLInputElement;
                                if (e.key === "Enter" && input.value.trim()) {
                                    actions.addSubtask(task.id, input.value);
                                    input.value = "";
                                }
                            }}
                        />
                    </label>
                </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
                <div className="group/list pl-14 mt-2 flex flex-wrap gap-1.5">
                    {task.attachments.map((att) => (
                        <div
                            key={att.id}
                            className="group flex items-center gap-1.5 bg-base-content/5 border border-base-content/8 rounded-md pl-2 pr-1 h-6 text-xs text-base-content/75 hover:bg-base-content/8 transition-colors"
                        >
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-base-content">
                                {getIconForUrl(att.url)}
                                <span className="max-w-[180px] truncate">{att.name}</span>
                            </a>
                            <button
                                onClick={() => actions.deleteAttachment(task.id, att.id)}
                                className="pointer-fine:opacity-0 group-hover:opacity-100 focus:opacity-100 text-base-content/50 hover:text-error p-1"
                                aria-label="Remove link"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => actions.openAttachment(task.id)}
                        className="pointer-fine:opacity-0 pointer-fine:group-hover/list:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md border border-dashed border-base-content/20 text-base-content/50 hover:text-base-content"
                        title="Add another link"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            )}
        </Reorder.Item>
    );
}

export default memo(DesktopTaskRow);
