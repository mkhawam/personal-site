"use client";

import { memo } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { Calendar, Check, CornerDownRight, Flag, GripVertical, MoreHorizontal, Plus, Repeat, Target, Trash2, X } from "lucide-react";
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

const priorityColor = (p?: string) =>
    p === "high" ? "text-error"
    : p === "medium" ? "text-warning"
    : "text-base-content/50";

// Dates are local yyyy-MM-dd strings, so string comparison is a date comparison.
const dueChipClass = (dueDate: string, todayStr: string) =>
    dueDate < todayStr ? "bg-error/20 text-error"
    : dueDate === todayStr ? "bg-warning/20 text-warning"
    : "bg-base-content/5 text-base-content/70";

const subtaskProgress = (t: Task) => (t.subtasks?.length ? t.subtasks.filter((s) => s.completed).length / t.subtasks.length : 0);

function DesktopTaskRow({ task, listName, todayStr, reorderDisabled, isFocused, isEditing, isMenuOpen, actions }: Props) {
    const prog = subtaskProgress(task);
    const hasSubtasks = !!task.subtasks && task.subtasks.length > 0;

    return (
        <Reorder.Item
            value={task}
            dragListener={!reorderDisabled}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.2, ease: "easeInOut" as const }}
            whileHover={{ scale: 1.005, backgroundColor: "rgba(255,255,255,0.05)" }}
            className={clsx(
                "relative flex flex-col p-4 rounded-xl border transition-colors bg-base-content/5",
                isFocused ? "border-warning/50 ring-2 ring-inset ring-warning/20 shadow-lg shadow-warning/10" : "border-transparent",
            )}
        >
            {prog > 0 && <div className="absolute bottom-0 left-0 h-1 bg-success/20" style={{ width: `${prog * 100}%` }} />}

            <div className="flex items-center gap-4 relative z-10">
                {!reorderDisabled && (
                    <div className="cursor-grab active:cursor-grabbing text-base-content/50 hover:text-base-content/70">
                        <GripVertical size={18} />
                    </div>
                )}

                <button
                    onClick={() => actions.toggle(task.id)}
                    className="w-6 h-6 rounded-full border-2 border-base-content/40 hover:border-primary flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Mark complete"
                />

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
                        className="flex-1 text-lg font-medium text-base-content/80 bg-transparent border-b-2 border-base-content/40 focus:border-primary outline-none px-1 py-0"
                    />
                :   <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <span
                            onDoubleClick={() => actions.startEdit(task.id)}
                            className="w-full text-lg font-medium select-none truncate text-base-content/80 cursor-text hover:text-base-content block"
                            title="Double-click to edit"
                        >
                            {task.text}
                        </span>
                        {listName && (
                            <span className="self-start px-2 py-0.5 rounded-md text-[11px] font-medium border bg-base-content/5 text-base-content/50 border-base-content/10">
                                {listName}
                            </span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {task.tags.map((tagId) => {
                                    const tag = TASK_TAGS.find((t) => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                        <span
                                            key={tag.id}
                                            className={clsx(
                                                "px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide border",
                                                tag.color.replace("500", "500/10"),
                                                tag.color.replace("bg-", "text-").replace("500", "400"),
                                                tag.color.replace("bg-", "border-").replace("500", "500/20"),
                                            )}
                                        >
                                            {tag.label}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                }

                <div className="flex gap-1 items-center shrink-0">
                    <button
                        onClick={() => actions.cyclePriority(task.id)}
                        className={clsx("p-2 rounded-lg transition-colors hover:bg-base-content/10", priorityColor(task.priority))}
                        title={`Priority: ${task.priority || "medium"} — click to cycle`}
                    >
                        <Flag size={16} fill={task.priority === "high" || task.priority === "medium" ? "currentColor" : "none"} />
                    </button>

                    {/* Recurrence — only surfaces once set; setting it lives in the ⋯ menu */}
                    {task.recurrence && (
                        <button
                            onClick={() => actions.cycleRecurrence(task.id)}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                task.recurrence === "daily" && "text-info bg-info/15",
                                task.recurrence === "weekly" && "text-secondary bg-secondary/15",
                                task.recurrence === "monthly" && "text-success bg-success/15",
                            )}
                            title={`Repeats ${task.recurrence} — click to cycle`}
                        >
                            <Repeat size={16} />
                        </button>
                    )}

                    {/* Pomodoro chip — only once an estimate or a logged session exists */}
                    {task.estimatedPomos || task.actualPomos ?
                        <button
                            onClick={(e) => actions.openPopover("estimate", task.id, e.currentTarget)}
                            className="flex items-center gap-1 px-2 py-1 bg-base-content/5 hover:bg-base-content/10 rounded-lg text-xs font-mono transition-colors"
                            title="Set pomodoro estimate"
                        >
                            <span className="text-error">🍅</span>
                            <span className="text-base-content/70">
                                {task.actualPomos || 0}/{task.estimatedPomos || "?"}
                            </span>
                        </button>
                    :   null}

                    <button
                        onClick={(e) => actions.openPopover("due", task.id, e.currentTarget)}
                        className={clsx(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                            task.dueDate ? dueChipClass(task.dueDate, todayStr) : "text-base-content/40 hover:text-base-content/80 hover:bg-base-content/10",
                        )}
                        title={task.dueDate ? `Due: ${new Date(task.dueDate + "T00:00:00").toLocaleDateString()}` : "Set due date"}
                    >
                        <Calendar size={14} />
                        {task.dueDate && (
                            <span>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        )}
                    </button>

                    <button
                        onClick={() => actions.toggleFocus(task.id)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors",
                            isFocused ? "text-warning bg-warning/20" : "text-base-content/50 hover:text-warning hover:bg-base-content/10",
                        )}
                        title={isFocused ? "Unfocus" : "Focus on task"}
                    >
                        <Target size={16} />
                    </button>

                    {/* Everything else (rename, subtask, notes, link, tags, repeat, estimate, move, archive) */}
                    <button
                        onClick={(e) => actions.openPopover("more", task.id, e.currentTarget)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors",
                            isMenuOpen ? "text-base-content bg-base-content/10" : "text-base-content/50 hover:text-base-content hover:bg-base-content/10",
                        )}
                        title="More actions"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    <button onClick={() => actions.remove(task.id)} className="p-2 text-error/40 hover:text-error hover:bg-error/10 rounded-lg" title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {task.notes && (
                <div className="pl-12 mt-2 text-sm text-base-content/70 font-serif prose prose-sm max-w-none relative z-10">
                    <ReactMarkdown>{task.notes}</ReactMarkdown>
                </div>
            )}

            {/* Subtasks — only once a task has some; a bare task gets "Add subtask" from the ⋯ menu */}
            {hasSubtasks && (
                <div className="pl-12 space-y-2 mt-2 relative z-10">
                    <AnimatePresence>
                        {task.subtasks.map((sub) => (
                            <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 text-sm"
                            >
                                <CornerDownRight size={14} className="text-base-content/30" />
                                <button
                                    onClick={() => actions.toggleSubtask(task.id, sub.id)}
                                    className="p-2 -m-2 flex items-center justify-center flex-shrink-0"
                                    aria-label={sub.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                                >
                                    <span
                                        className={clsx(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            sub.completed ? "bg-base-content/40 border-base-content/40" : "border-base-content/25 hover:border-base-content/40",
                                        )}
                                    >
                                        {sub.completed && <Check size={10} className="text-base-100" />}
                                    </span>
                                </button>
                                <span className={clsx("flex-1 text-base-content/70 transition-colors", sub.completed && "line-through text-base-content/30")}>
                                    {sub.text}
                                </span>
                                <button
                                    onClick={() => actions.deleteSubtask(task.id, sub.id)}
                                    className="text-base-content/30 hover:text-error transition-colors"
                                    aria-label="Delete subtask"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <div className="flex items-center gap-3 text-sm opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <CornerDownRight size={14} className="text-base-content/30" />
                        <Plus size={14} className="text-base-content/50" />
                        <input
                            type="text"
                            placeholder="Add subtask..."
                            className="flex-1 bg-transparent text-base-content/70 placeholder:text-base-content/30 outline-none text-sm"
                            onKeyDown={(e) => {
                                const input = e.target as HTMLInputElement;
                                if (e.key === "Enter" && input.value.trim()) {
                                    actions.addSubtask(task.id, input.value);
                                    input.value = "";
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
                <div className="group/list pl-12 mt-3 flex flex-wrap gap-2 relative z-10">
                    {task.attachments.map((att) => (
                        <div
                            key={att.id}
                            className="group flex items-center gap-2 bg-base-300/50 border border-base-content/5 rounded-full px-3 py-1 text-xs text-base-content/80 hover:bg-base-300/70 transition-colors"
                        >
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-base-content">
                                {getIconForUrl(att.url)}
                                <span className="max-w-[150px] truncate">{att.name}</span>
                            </a>
                            <button
                                onClick={() => actions.deleteAttachment(task.id, att.id)}
                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-base-content/50 hover:text-error p-2 -m-1"
                                aria-label="Remove link"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => actions.openAttachment(task.id)}
                        className="opacity-100 md:opacity-0 md:group-hover/list:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-full bg-base-300 border border-base-content/10 text-base-content/50 hover:text-base-content hover:bg-base-300/70"
                        title="Add another link"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            )}

            {hasSubtasks && <div className="absolute bottom-2 right-3 text-[10px] font-mono text-base-content/40 z-10">{Math.round(prog * 100)}%</div>}
        </Reorder.Item>
    );
}

export default memo(DesktopTaskRow);
