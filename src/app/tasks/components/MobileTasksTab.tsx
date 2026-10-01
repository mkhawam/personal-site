"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { ArrowUpDown, Check, ChevronDown, Plus, Search, Sun, Trash2, X } from "lucide-react";
import { TODAY_LIST_ID, type SortMode } from "../constants";
import type { TaskActions } from "../hooks/useTaskStore";
import type { Task, TaskList } from "../types";
import MobileTaskCard from "./MobileTaskCard";

type Props = {
    lists: TaskList[];
    activeListId: string;
    onSelectList: (id: string) => void;
    onCreateList: () => void;
    todayCount: number;
    sortMode: SortMode;
    onCycleSort: () => void;
    searchQuery: string;
    onSearch: (q: string) => void;
    newTaskText: string;
    onNewTaskText: (s: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    addInputRef: RefObject<HTMLInputElement | null>;
    displayTasks: Task[];
    completedTasks: Task[];
    listNameById: Map<string, string>;
    currentTaskId: string | null;
    showCompleted: boolean;
    onToggleCompleted: () => void;
    actions: TaskActions;
    onOpenSheet: (id: string) => void;
};

const ICON_BTN = "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-base-content/5 transition-colors";

export default function MobileTasksTab(p: Props) {
    const [searchOpen, setSearchOpen] = useState(false);
    const isToday = p.activeListId === TODAY_LIST_ID;

    return (
        <>
            <div className="px-4 pb-2 bg-base-100 z-20 shrink-0 border-b border-base-content/5 pt-2">
                <div className="space-y-4">
                    {/* List strip; sort/search sit outside it so they never scroll away */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 flex gap-1 bg-base-content/5 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => p.onSelectList(TODAY_LIST_ID)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                                    isToday ? "bg-primary text-primary-content" : "text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80",
                                )}
                            >
                                <Sun size={14} />
                                Today
                                {p.todayCount > 0 && (
                                    <span className={clsx("text-[11px] font-bold px-1.5 py-0.5 rounded-full", isToday ? "bg-primary-content/20" : "bg-base-content/10")}>
                                        {p.todayCount}
                                    </span>
                                )}
                            </button>
                            {p.lists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => p.onSelectList(list.id)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                        p.activeListId === list.id ? "bg-primary text-primary-content" : "text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80",
                                    )}
                                >
                                    {list.name}
                                </button>
                            ))}
                            <button onClick={p.onCreateList} className="px-3 py-2 rounded-lg text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80" aria-label="Create new list">
                                <Plus size={16} />
                            </button>
                        </div>
                        {!isToday && (
                            <button onClick={p.onCycleSort} className={clsx(ICON_BTN, p.sortMode !== "manual" ? "text-primary" : "text-base-content/50")} aria-label="Cycle sort mode">
                                <ArrowUpDown size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (searchOpen) p.onSearch(""); // collapsing must clear the invisible filter
                                setSearchOpen(!searchOpen);
                            }}
                            className={clsx(ICON_BTN, p.searchQuery.trim() ? "text-primary" : searchOpen ? "text-base-content" : "text-base-content/50")}
                            aria-label="Search tasks"
                            aria-expanded={searchOpen}
                        >
                            <Search size={16} />
                        </button>
                    </div>

                    {searchOpen && (
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={p.searchQuery}
                                onChange={(e) => p.onSearch(e.target.value)}
                                autoFocus
                                className="w-full bg-base-content/5 text-base-content/80 pl-9 pr-9 py-2.5 rounded-xl border border-base-content/10 focus:outline-none focus:border-base-content/40 text-sm"
                            />
                            {p.searchQuery && (
                                <button onClick={() => p.onSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-base-content/50" aria-label="Clear search">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={p.onSubmit} className="flex gap-2">
                        <input
                            ref={p.addInputRef}
                            type="text"
                            value={p.newTaskText}
                            onChange={(e) => p.onNewTaskText(e.target.value)}
                            placeholder="Add task… #tag !high @fri"
                            className="flex-1 bg-base-content/5 border border-base-content/10 rounded-xl px-4 py-3 text-base-content focus:outline-none focus:border-base-content/40"
                        />
                        <button type="submit" className="bg-primary text-primary-content rounded-xl px-4 font-bold" aria-label="Add task">
                            <Plus />
                        </button>
                    </form>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 scrollbar-hide overscroll-none">
                <div className="space-y-3">
                    <AnimatePresence>
                        {p.displayTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                className="relative group"
                            >
                                <MobileTaskCard
                                    task={task}
                                    listName={isToday ? (p.listNameById.get(task.listId || "default") ?? "My Tasks") : undefined}
                                    isFocused={p.currentTaskId === task.id}
                                    onToggle={() => p.actions.toggleTask(task.id)}
                                    onDelete={() => p.actions.deleteTask(task.id)}
                                    onOpenSheet={() => p.onOpenSheet(task.id)}
                                    onToggleSubtask={(subId) => p.actions.toggleSubtask(task.id, subId)}
                                    onAddSubtask={(text) => p.actions.addSubtask(task.id, text)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {p.displayTasks.length === 0 && (
                        <div className="text-center py-20 text-base-content/50">
                            {p.searchQuery.trim() ? "No tasks match your search"
                            : isToday ? "Nothing due today 🎉"
                            : "No active tasks"}
                        </div>
                    )}

                    {p.completedTasks.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-base-content/5">
                            <button onClick={p.onToggleCompleted} className="flex items-center gap-2 mb-3 px-2 w-full" aria-expanded={p.showCompleted}>
                                <ChevronDown size={16} className={clsx("text-base-content/50 transition-transform", !p.showCompleted && "-rotate-90")} />
                                <h3 className="text-sm font-bold text-base-content/50">Completed ({p.completedTasks.length})</h3>
                            </button>

                            <AnimatePresence>
                                {p.showCompleted && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-3 overflow-hidden opacity-60"
                                    >
                                        {p.completedTasks.map((task) => (
                                            <div key={task.id} className="relative p-4 bg-base-200/50 border border-base-content/5 rounded-2xl flex items-start gap-3 transition-colors">
                                                <button
                                                    onClick={() => p.actions.toggleTask(task.id)}
                                                    className="w-11 h-11 -m-2.5 mt-[-7px] flex items-center justify-center flex-shrink-0"
                                                    aria-label="Mark incomplete"
                                                >
                                                    <span className="w-6 h-6 rounded-full border-2 border-success bg-success flex items-center justify-center">
                                                        <Check size={14} className="text-success-content" />
                                                    </span>
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-lg block truncate text-base-content/50 line-through">{task.text}</span>
                                                </div>
                                                <button
                                                    onClick={() => p.actions.deleteTask(task.id)}
                                                    className="w-11 h-11 -m-1.5 flex items-center justify-center text-base-content/50 hover:text-error"
                                                    aria-label="Delete task"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
