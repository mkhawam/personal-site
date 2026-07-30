"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ArrowUpCircle, Calendar, Check, Flag, Flame, MoreHorizontal, Plus, Repeat, Trash2 } from "lucide-react";
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

function dueDateChipClass(dueDate: string) {
    const due = new Date(dueDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return "bg-error/20 text-error";
    if (due.getTime() === today.getTime()) return "bg-warning/20 text-warning";
    return "bg-base-content/5 text-base-content/60";
}

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

    const priorityChip =
        task.priority === "high" ? "text-error"
        : task.priority === "low" ? "text-base-content/40"
        : null; // medium is the default — no chip noise

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
                    "relative p-4 bg-base-200 border rounded-2xl flex items-start gap-3 active:bg-base-300 transition-all z-10",
                    isFocused ? "border-warning/50 ring-2 ring-inset ring-warning/20" : "border-base-content/5",
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
                            task.completed ? "bg-success border-success" : "border-base-content/40",
                        )}
                    >
                        {task.completed && <Check size={14} className="text-success-content" />}
                    </span>
                </button>

                <div className="flex-1 min-w-0">
                    <span
                        className={clsx(
                            "text-lg block truncate",
                            task.completed ? "text-base-content/50 line-through" : "text-base-content",
                        )}
                    >
                        {task.text}
                    </span>

                    {/* Metadata chips — everything the sheet can set is visible here */}
                    {(listName || task.dueDate || priorityChip || task.recurrence || task.tags?.length || task.estimatedPomos) ?
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {listName && (
                                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-base-content/5 text-base-content/50 border border-base-content/10">
                                    {listName}
                                </span>
                            )}
                            {priorityChip && <Flag size={12} className={priorityChip} fill={task.priority === "high" ? "currentColor" : "none"} />}
                            {task.recurrence && <Repeat size={12} className="text-info" />}
                            {task.dueDate && (
                                <span className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium", dueDateChipClass(task.dueDate))}>
                                    <Calendar size={10} />
                                    {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                            )}
                            {(task.tags || []).map((tagId) => {
                                const tag = TASK_TAGS.find((t) => t.id === tagId);
                                return tag ? <span key={tag.id} className={clsx("w-2 h-2 rounded-full", tag.color)} title={tag.label} /> : null;
                            })}
                            {task.estimatedPomos ?
                                <span className="flex items-center gap-1 text-[11px] text-base-content/50">
                                    <Flame size={10} className="text-warning" />
                                    {task.actualPomos || 0}/{task.estimatedPomos}
                                </span>
                            :   null}
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
                                            "w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0",
                                            st.completed ? "bg-base-content/40 border-base-content/40" : "border-base-content/40",
                                        )}
                                    >
                                        {st.completed && <Check size={10} className="text-base-100" />}
                                    </span>
                                    <span className={clsx("transition-opacity truncate", st.completed && "line-through opacity-50")}>{st.text}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick Add Subtask */}
                    {addingSubtask ?
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
