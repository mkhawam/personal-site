"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { addDays, addWeeks, format } from "date-fns";
import { Archive, ArrowDown, ArrowUp, Calendar, Check, FileText, Paperclip, Target, Trash2 } from "lucide-react";
import type { Task, TaskList, TaskTag } from "../types";

type Props = {
    task: Task | null; // null = closed; parent derives from state by id so edits render live
    lists: TaskList[];
    tags: TaskTag[];
    isFocused: boolean;
    canReorder?: boolean; // false while a sort mode or the Today view controls ordering
    onClose: () => void;
    onUpdate: (patch: Partial<Task>) => void;
    onToggleTag: (tagId: string) => void;
    onDelete: () => void;
    onArchive: () => void;
    onToggleFocus: () => void;
    onMove: (dir: -1 | 1) => void;
    onOpenNotes: () => void;
    onOpenAttachment: () => void;
    onOpenSubtask: () => void;
};

const PRIORITIES = [
    { id: "low" as const, label: "Low", active: "bg-base-content/20 text-base-content" },
    { id: "medium" as const, label: "Medium", active: "bg-warning/30 text-warning" },
    { id: "high" as const, label: "High", active: "bg-error/30 text-error" },
];

const RECURRENCES = [
    { id: null, label: "None", active: "bg-base-content/20 text-base-content" },
    { id: "daily" as const, label: "Daily", active: "bg-info/30 text-info" },
    { id: "weekly" as const, label: "Weekly", active: "bg-secondary/30 text-secondary" },
    { id: "monthly" as const, label: "Monthly", active: "bg-success/30 text-success" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">{children}</div>;
}

export default function TaskActionSheet({
    task,
    lists,
    tags,
    isFocused,
    canReorder = true,
    onClose,
    onUpdate,
    onToggleTag,
    onDelete,
    onArchive,
    onToggleFocus,
    onMove,
    onOpenNotes,
    onOpenAttachment,
    onOpenSubtask,
}: Props) {
    const [titleDraft, setTitleDraft] = useState(task?.text ?? "");

    // Re-seed the draft when a different task opens (or after an external edit)
    useEffect(() => {
        setTitleDraft(task?.text ?? "");
    }, [task?.id, task?.text]);

    const commitTitle = () => {
        const text = titleDraft.trim();
        if (task && text && text !== task.text) onUpdate({ text });
    };

    const today = format(new Date(), "yyyy-MM-dd");

    return (
        <AnimatePresence>
            {task && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (info.offset.y > 120 || info.velocity.y > 800) onClose();
                        }}
                        className="absolute bottom-0 inset-x-0 bg-base-200 border-t border-base-content/10 rounded-t-3xl max-h-[85dvh] overflow-y-auto pb-safe"
                    >
                        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-base-content/20" />

                        <div className="p-5 space-y-5">
                            {/* Title — tap to edit inline */}
                            <input
                                type="text"
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={commitTitle}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                    if (e.key === "Escape") setTitleDraft(task.text);
                                }}
                                className="w-full bg-transparent text-xl font-semibold text-base-content border-b-2 border-base-content/10 focus:border-primary outline-none pb-2 min-h-12"
                            />

                            {/* Priority */}
                            <div>
                                <SectionLabel>Priority</SectionLabel>
                                <div className="grid grid-cols-3 gap-2">
                                    {PRIORITIES.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => onUpdate({ priority: p.id })}
                                            className={clsx(
                                                "min-h-12 rounded-xl text-sm font-medium transition-colors",
                                                (task.priority || "medium") === p.id ? p.active : "bg-base-content/5 text-base-content/60",
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recurrence */}
                            <div>
                                <SectionLabel>Repeats</SectionLabel>
                                <div className="grid grid-cols-4 gap-2">
                                    {RECURRENCES.map((r) => (
                                        <button
                                            key={r.label}
                                            onClick={() => onUpdate({ recurrence: r.id })}
                                            className={clsx(
                                                "min-h-12 rounded-xl text-sm font-medium transition-colors",
                                                (task.recurrence || null) === r.id ? r.active : "bg-base-content/5 text-base-content/60",
                                            )}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Due date */}
                            <div>
                                <SectionLabel>Due Date</SectionLabel>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {[
                                        { label: "Today", value: today },
                                        { label: "Tomorrow", value: format(addDays(new Date(), 1), "yyyy-MM-dd") },
                                        { label: "Next week", value: format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
                                    ].map((c) => (
                                        <button
                                            key={c.label}
                                            onClick={() => onUpdate({ dueDate: c.value })}
                                            className={clsx(
                                                "min-h-11 px-4 rounded-xl text-sm font-medium transition-colors",
                                                task.dueDate === c.value ? "bg-primary text-primary-content" : "bg-base-content/5 text-base-content/60",
                                            )}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                    {task.dueDate && (
                                        <button
                                            onClick={() => onUpdate({ dueDate: undefined })}
                                            className="min-h-11 px-4 rounded-xl text-sm font-medium bg-base-content/5 text-error"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-base-content/5 rounded-xl px-4 min-h-12">
                                    <Calendar size={16} className="text-base-content/50 shrink-0" />
                                    <input
                                        type="date"
                                        value={task.dueDate || ""}
                                        onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
                                        className="flex-1 bg-transparent text-base-content outline-none min-h-12"
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <SectionLabel>Tags</SectionLabel>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => {
                                        const selected = (task.tags || []).includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => onToggleTag(tag.id)}
                                                className={clsx(
                                                    "min-h-11 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                                                    selected ? `${tag.color} text-white` : "bg-base-content/5 text-base-content/60",
                                                )}
                                            >
                                                <span className={clsx("w-2 h-2 rounded-full", tag.color, selected && "bg-white/80")} />
                                                {tag.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Estimate */}
                            <div>
                                <SectionLabel>Pomodoro Estimate</SectionLabel>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => onUpdate({ estimatedPomos: Math.max(0, (task.estimatedPomos || 0) - 1) || undefined })}
                                        className="w-12 h-12 rounded-xl bg-base-content/5 text-base-content text-xl font-bold"
                                    >
                                        −
                                    </button>
                                    <div className="flex-1 text-center text-lg font-mono text-base-content">
                                        🍅 {task.actualPomos || 0}/{task.estimatedPomos || "?"}
                                    </div>
                                    <button
                                        onClick={() => onUpdate({ estimatedPomos: (task.estimatedPomos || 0) + 1 })}
                                        className="w-12 h-12 rounded-xl bg-base-content/5 text-base-content text-xl font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Focus + reorder */}
                            <div className={clsx("grid gap-2", canReorder ? "grid-cols-3" : "grid-cols-1")}>
                                <button
                                    onClick={onToggleFocus}
                                    className={clsx(
                                        "min-h-12 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                                        isFocused ? "bg-warning/30 text-warning" : "bg-base-content/5 text-base-content/60",
                                    )}
                                >
                                    <Target size={16} />
                                    {isFocused ? "Focused" : "Focus"}
                                </button>
                                {canReorder && (
                                    <>
                                        <button
                                            onClick={() => onMove(-1)}
                                            className="min-h-12 rounded-xl bg-base-content/5 text-base-content/60 text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <ArrowUp size={16} />
                                            Move up
                                        </button>
                                        <button
                                            onClick={() => onMove(1)}
                                            className="min-h-12 rounded-xl bg-base-content/5 text-base-content/60 text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <ArrowDown size={16} />
                                            Move down
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Move to list */}
                            {lists.length > 1 && (
                                <div>
                                    <SectionLabel>List</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {lists.map((list) => {
                                            const current = (task.listId || "default") === list.id;
                                            return (
                                                <button
                                                    key={list.id}
                                                    onClick={() => !current && onUpdate({ listId: list.id })}
                                                    className={clsx(
                                                        "min-h-11 px-4 rounded-xl text-sm font-medium transition-colors",
                                                        current ? "bg-primary text-primary-content" : "bg-base-content/5 text-base-content/60",
                                                    )}
                                                >
                                                    {list.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Detail editors (existing modals) */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={onOpenSubtask}
                                    className="min-h-12 rounded-xl bg-base-content/5 text-base-content/70 text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Check size={16} />
                                    Subtask
                                </button>
                                <button
                                    onClick={onOpenNotes}
                                    className={clsx(
                                        "min-h-12 rounded-xl text-sm font-medium flex items-center justify-center gap-2",
                                        task.notes ? "bg-warning/20 text-warning" : "bg-base-content/5 text-base-content/70",
                                    )}
                                >
                                    <FileText size={16} />
                                    Notes
                                </button>
                                <button
                                    onClick={onOpenAttachment}
                                    className={clsx(
                                        "min-h-12 rounded-xl text-sm font-medium flex items-center justify-center gap-2",
                                        task.attachments?.length ? "bg-secondary/20 text-secondary" : "bg-base-content/5 text-base-content/70",
                                    )}
                                >
                                    <Paperclip size={16} />
                                    Link
                                </button>
                            </div>

                            {/* Danger zone */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={onArchive}
                                    className="min-h-12 rounded-xl bg-warning/10 text-warning text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Archive size={16} />
                                    Archive
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="min-h-12 rounded-xl bg-error/10 text-error text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
