"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Plus, X } from "lucide-react";
import type { NotePage } from "../constants";
import NoteEditor from "./NoteEditor";

type SharedProps = {
    pages: NotePage[];
    onChange: (pages: NotePage[]) => void;
    activeId: string;
    onSelect: (id: string) => void;
};

/** Desktop slide-in notes panel with renamable page tabs. */
export default function NotesPanel({ open, onClose, pages, onChange, activeId, onSelect }: SharedProps & { open: boolean; onClose: () => void }) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const activePage = pages.find((p) => p.id === activeId) || pages[0];

    const rename = (id: string, title: string) => {
        onChange(pages.map((p) => (p.id === id ? { ...p, title: title || "Untitled" } : p)));
        setEditingId(null);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-30" />
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="fixed top-0 right-0 w-full md:w-[60%] h-full bg-base-200 border-l border-base-content/10 z-40 shadow-2xl flex flex-col"
                        role="dialog"
                        aria-label="Notes"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-base-content/10">
                            <h3 className="text-lg font-bold text-base-content">📝 Notes</h3>
                            <button onClick={onClose} className="text-base-content/50 hover:text-base-content" aria-label="Close notes">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 p-3 border-b border-base-content/10 overflow-x-auto scrollbar-hide">
                            {pages.map((page) => (
                                <button
                                    key={page.id}
                                    onClick={() => onSelect(page.id)}
                                    onDoubleClick={() => setEditingId(page.id)}
                                    title="Double-click to rename"
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 group",
                                        activeId === page.id ? "bg-primary text-primary-content" : "bg-base-content/5 text-base-content/70 hover:text-base-content/80",
                                    )}
                                >
                                    {editingId === page.id ?
                                        <input
                                            type="text"
                                            defaultValue={page.title}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => rename(page.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") rename(page.id, (e.target as HTMLInputElement).value);
                                                if (e.key === "Escape") setEditingId(null);
                                            }}
                                            className="bg-transparent border-none outline-none w-20 text-inherit"
                                        />
                                    :   page.title}
                                    {pages.length > 1 && editingId !== page.id && (
                                        <span
                                            role="button"
                                            aria-label={`Delete page ${page.title}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const next = pages.filter((p) => p.id !== page.id);
                                                onChange(next);
                                                if (activeId === page.id && next.length > 0) onSelect(next[0].id);
                                            }}
                                            className="text-base-content/50 hover:text-error opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </span>
                                    )}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    const id = Date.now().toString(36);
                                    onChange([...pages, { id, title: `Page ${pages.length + 1}`, content: "" }]);
                                    onSelect(id);
                                }}
                                className="px-2 py-1.5 text-base-content/50 hover:text-base-content/80 hover:bg-base-content/10 rounded-lg text-sm"
                                title="Add new page"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <NoteEditor
                            variant="desktop"
                            content={activePage?.content || ""}
                            onChange={(c) => onChange(pages.map((p) => (p.id === activeId ? { ...p, content: c } : p)))}
                        />
                        <div className="p-3 border-t border-base-content/10 text-xs text-base-content/50 text-center">
                            Auto-saved • {activePage?.content.length || 0} characters
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/** Mobile Notes tab: page chips + editor. */
export function MobileNotesTab({ pages, onChange, activeId, onSelect }: SharedProps) {
    return (
        <div className="h-full flex flex-col px-4 pb-2">
            <div className="flex gap-2 bg-base-content/5 p-1 rounded-xl mb-2 overflow-x-auto scrollbar-hide shrink-0">
                {pages.map((page) => (
                    <button
                        key={page.id}
                        onClick={() => onSelect(page.id)}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            activeId === page.id ? "bg-primary text-primary-content" : "text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80",
                        )}
                    >
                        {page.title}
                    </button>
                ))}
                <button
                    onClick={() => {
                        const id = Date.now().toString(36);
                        onChange([...pages, { id, title: `Page ${pages.length + 1}`, content: "" }]);
                        onSelect(id);
                    }}
                    className="px-3 py-2 rounded-lg text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80"
                    aria-label="Add new page"
                >
                    <Plus size={16} />
                </button>
            </div>

            <NoteEditor
                variant="mobile"
                content={pages.find((n) => n.id === activeId)?.content || ""}
                onChange={(c) => onChange(pages.map((p) => (p.id === activeId ? { ...p, content: c } : p)))}
            />
        </div>
    );
}
