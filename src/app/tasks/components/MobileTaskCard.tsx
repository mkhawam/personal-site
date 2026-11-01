"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ArrowUpCircle, Calendar, Check, Flag, ListChecks, MoreHorizontal, Plus, Repeat, Timer, Trash2 } from "lucide-react";
import { dueLabel, localToday, type DueTone } from "../lib/dates";
import { TASK_TAGS, type Task } from "../types";

type Props = {
    task: Task;
    isFocused: boolean;
    listName?: string; // shown in the cross-list Today view
    onToggle: () => void;
    onDelete: () => void;
    onOpenSheet: () => void;
    onToggleSubtask: (subId: string) => void;
    onAddSubtask: (text: string) => void;
};

const DUE_TONE: Record<DueTone, string> = {
    overdue: "bg-error/12 text-error",
    today: "bg-warning/15 text-warning",
    soon: "bg-base-content/6 text-base-content/80",
    later: "bg-base-content/6 text-base-content/60",
};

// Same priority-on-the-ring convention as the desktop row
const ringClass = (p?: string) =>
    p === "high" ? "border-error"
    : p === "low" ? "border-base-content/20"
    : "border-base-content/40";

const CHIP = "inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[11px] font-medium leading-none";

export default function MobileTaskCard({ task, isFocused, listName, onToggle, onDelete, onOpenSheet, onToggleSubtask, onAddSubtask }: Props) {
    const [addingSubtask, setAddingSubtask] = useState(false);
    const [subtaskDraft, setSubtaskDraft] = useState("");

    const submitSubtask = () => {
        if (subtaskDraft.trim()) {
            onAddSubtask(subtaskDraft.trim());
            setSubtaskDraft("");
            // stay in adding mode for fast multi-entry
        } else {
            setAddingSubtask(false);
        }
    };

    const due = task.dueDate ? dueLabel(task.dueDate, localToday()) : null;
    const tags = (task.tags ?? []).map((id) => TASK_TAGS.find((t) => t.id === id)).filter((t) => !!t);
    const doneSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;

    return (
        <div className="relative">
            {/* Trash Background Layer */}
            <div className="absolute inset-0 bg-error/20 rounded-2xl flex items-center justify-end px-6 z-0">
                <Trash2 className="text-error" />
            </div>

            {/* Swipeable Task Card — swipe far (or flick) to soft-delete with undo */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(e, info) => {
                    if (info.offset.x < -100 || (info.offset.x < -60 && info.velocity.x < -500)) {
                        onDelete();
                    }
                }}
                whileDrag={{ scale: 1.02 }}
                onClick={onOpenSheet}
                className={clsx(
                    "relative px-4 py-3.5 bg-base-200 border rounded-2xl flex items-start gap-3 active:bg-base-300 transition-colors z-10",
                    isFocused ? "border-warning/50 ring-1 ring-inset ring-warning/30" : "border-base-content/8",
                )}
                style={{ touchAction: "pan-y" }} // Important for scrolling while dragging
            >
                {/* Checkbox is the ONLY completion target (44px hit area, 24px visual) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if ("vibrate" in navigator) navigator.vibrate?.(10);
                        onToggle();
                    }}
                    className="w-11 h-11 -m-2.5 mt-[-7px] flex items-center justify-center flex-shrink-0"
                    aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                    <span
                        className={clsx(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            task.completed ? "bg-success border-success" : ringClass(task.priority),
                        )}
                    >
                        {task.completed && <Check size={14} className="text-success-content" />}
                    </span>
                </button>

                <div className="flex-1 min-w-0">
                    <span
                        className={clsx(
                            "text-base leading-6 font-medium line-clamp-2 break-words",
                            task.completed ? "text-base-content/50 line-through" : "text-base-content",
                        )}
                    >
                        {task.text}
                    </span>

                    {/* Metadata chips — everything the sheet can set is visible here */}
                    {(listName || due || task.priority === "high" || task.recurrence || tags.length || task.estimatedPomos || task.subtasks?.length) ?
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {task.priority === "high" && <Flag size={12} className="text-error" fill="currentColor" aria-label="High priority" />}
                            {due && (
                                <span className={clsx(CHIP, DUE_TONE[due.tone])}>
                                    <Calendar size={10} />
                                    {due.text}
                                </span>
                            )}
                            {task.recurrence && (
                                <span className={clsx(CHIP, "bg-info/10 text-info")}>
                                    <Repeat size={10} />
                                    {task.recurrence}
                                </span>
                            )}
                            {task.estimatedPomos ?
                                <span className={clsx(CHIP, "first:pl-0 text-base-content/60 tabular-nums")}>
                                    <Timer size={10} />
                                    {task.actualPomos || 0}/{task.estimatedPomos}
                                </span>
                            :   null}
                            {task.subtasks?.length ?
                                <span className={clsx(CHIP, "first:pl-0 tabular-nums", doneSubtasks === task.subtasks.length ? "text-success" : "text-base-content/60")}>
                                    <ListChecks size={10} />
                                    {doneSubtasks}/{task.subtasks.length}
                                </span>
                            :   null}
                            {listName && <span className={clsx(CHIP, "text-base-content/50 border border-base-content/10")}>{listName}</span>}
                            {tags.map((tag) => (
                                <span key={tag.id} className={clsx(CHIP, "border", tag.chip)}>
                                    {tag.label}
                                </span>
                            ))}
                        </div>
                    :   null}

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                            {task.subtasks.map((st) => (
                                <button
                                    key={st.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSubtask(st.id);
                                    }}
                                    className="w-full min-h-11 -my-1 flex items-center gap-2 text-sm text-base-content/70 active:opacity-70 text-left"
                                >
                                    <span
                                        className={clsx(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                            st.completed ? "bg-success border-success" : "border-base-content/35",
                                        )}
                                    >
                                        {st.completed && <Check size={10} strokeWidth={3} className="text-success-content" />}
                                    </span>
                                    <span className={clsx("transition-opacity truncate", st.completed && "line-through opacity-50")}>{st.text}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick Add Subtask — only once subtasks exist (the sheet's "Subtask" button starts the first one) */}
                    {!addingSubtask && !(task.subtasks && task.subtasks.length > 0) ?
                        null
                    : addingSubtask ?
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                submitSubtask();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 flex items-center gap-2"
                        >
                            <div className="w-4 h-4 rounded-full border border-base-content/40 flex-shrink-0" />
                            <input
                                type="text"
                                autoFocus
                                value={subtaskDraft}
                                onChange={(e) => setSubtaskDraft(e.target.value)}
                                onBlur={() => {
                                    // Delay slightly to allow Submit click
                                    setTimeout(() => {
                                        if (!subtaskDraft.trim()) setAddingSubtask(false);
                                    }, 100);
                                }}
                                placeholder="New subtask..."
                                className="bg-transparent text-sm text-base-content/80 focus:outline-none flex-1 placeholder:text-base-content/50"
                            />
                            <button type="submit" className="text-base-content/70 p-1">
                                <ArrowUpCircle size={20} />
                            </button>
                        </form>
                    :   <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setAddingSubtask(true);
                                setSubtaskDraft("");
                            }}
                            className="mt-1 min-h-11 flex items-center gap-2 text-xs text-base-content/50 active:text-base-content/80"
                        >
                            <Plus size={12} className="text-base-content/50" />
                            Add subtask
                        </button>
                    }
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenSheet();
                    }}
                    className="w-11 h-11 -m-1.5 flex items-center justify-center text-base-content/50 active:text-base-content/80"
                    aria-label="Task options"
                >
                    <MoreHorizontal size={20} />
                </button>
            </motion.div>
        </div>
    );
}
