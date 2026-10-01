"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { ChevronDown, FolderPlus, Sun, Trash2 } from "lucide-react";
import { TODAY_LIST_ID } from "../constants";
import type { TaskList } from "../types";

type Props = {
    lists: TaskList[];
    activeListId: string;
    todayCount: number;
    onSelect: (id: string) => void;
    onDeleteList: (id: string) => void;
    onCreateList: () => void;
};

/** Desktop page title that doubles as the list dropdown. */
export default function ListSwitcher({ lists, activeListId, todayCount, onSelect, onDeleteList, onCreateList }: Props) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const title = activeListId === TODAY_LIST_ID ? "Today" : lists.find((l) => l.id === activeListId)?.name || "My Tasks";

    // Outside click / Escape close — the dropdown used to stay open until a pick
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const pick = (id: string) => {
        onSelect(id);
        setOpen(false);
    };

    const itemClass = (active: boolean) =>
        clsx(
            "group/item w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium",
            active ? "bg-primary text-primary-content" : "text-base-content/70 hover:bg-base-content/5 hover:text-base-content",
        );

    return (
        <div className="relative" ref={rootRef}>
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 group" aria-haspopup="listbox" aria-expanded={open}>
                <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">{title}</h1>
                <ChevronDown size={24} className={clsx("text-base-content/50 group-hover:text-base-content/80 transition-all", open && "rotate-180")} />
            </button>
            <p className="text-base-content/50 mt-1 text-sm font-medium">Capture ideas. Stay focused.</p>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-base-200 border border-base-content/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        role="listbox"
                    >
                        <div className="p-2 space-y-1">
                            {/* Virtual Today view — pinned, cross-list, no delete */}
                            <div className={itemClass(activeListId === TODAY_LIST_ID)}>
                                <button onClick={() => pick(TODAY_LIST_ID)} className="flex-1 text-left flex items-center gap-2" role="option" aria-selected={activeListId === TODAY_LIST_ID}>
                                    <Sun size={16} />
                                    Today
                                    {todayCount > 0 && (
                                        <span
                                            className={clsx(
                                                "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                                                activeListId === TODAY_LIST_ID ? "bg-primary-content/20" : "bg-base-content/10 text-base-content/70",
                                            )}
                                        >
                                            {todayCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            {lists.map((list) => (
                                <div key={list.id} className={itemClass(activeListId === list.id)}>
                                    <button onClick={() => pick(list.id)} className="flex-1 text-left" role="option" aria-selected={activeListId === list.id}>
                                        {list.name}
                                    </button>
                                    {list.id !== "default" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteList(list.id);
                                            }}
                                            className={clsx(
                                                "p-1.5 rounded-md transition-colors",
                                                activeListId === list.id ?
                                                    "text-base-content/50 hover:text-error hover:bg-primary/80"
                                                :   "text-base-content/50 hover:text-error hover:bg-base-content/10 opacity-0 group-hover/item:opacity-100 focus:opacity-100",
                                            )}
                                            title="Delete List"
                                            aria-label={`Delete list ${list.name}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-base-content/5 p-2">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onCreateList();
                                }}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-base-content/50 hover:bg-base-content/5 hover:text-base-content transition-colors font-medium"
                            >
                                <FolderPlus size={18} />
                                Create New List
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
