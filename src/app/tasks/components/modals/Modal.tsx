"use client";

import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Archive, BarChart3, FolderPlus, Keyboard, Paperclip, Settings, Sparkles, X } from "lucide-react";
import type { ModalType } from "../../constants";

const META: Record<ModalType, { title: string; icon?: React.ReactNode }> = {
    SUBTASK: { title: "Add Subtask" },
    NOTE: { title: "Notes" },
    BRAINSTORM: { title: "AI Assistant", icon: <Sparkles size={20} /> },
    SETTINGS: { title: "Timer Settings", icon: <Settings size={20} /> },
    ARCHIVE: { title: "Archived Tasks", icon: <Archive size={20} /> },
    ATTACHMENT: { title: "Add Link Attachment", icon: <Paperclip size={20} /> },
    SHORTCUTS: { title: "Keyboard Shortcuts", icon: <Keyboard size={20} /> },
    STATS: { title: "Productivity Stats & Summary", icon: <BarChart3 size={20} /> },
    NEW_LIST: { title: "Create New List", icon: <FolderPlus size={20} /> },
    SYNC: { title: "Secure Sync" },
};

const SIZE: Partial<Record<ModalType, string>> = {
    BRAINSTORM: "max-w-5xl h-[80vh]",
    NOTE: "max-w-2xl h-[70vh]",
    STATS: "max-w-2xl",
};

type Props = { type: ModalType | null; onClose: () => void; children: React.ReactNode };

/** One animated shell for every dialog; the body is whatever the page renders for `type`. */
export default function Modal({ type, onClose, children }: Props) {
    const fills = type === "NOTE" || type === "BRAINSTORM";
    return (
        <AnimatePresence>
            {type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={META[type].title}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={clsx(
                            "relative w-full bg-base-200 border border-base-content/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col",
                            SIZE[type] ?? "max-w-lg",
                        )}
                    >
                        <div className={clsx("p-6 overflow-y-auto custom-scrollbar", fills && "flex-1 flex flex-col min-h-0")}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 text-base-content">
                                    {META[type].icon}
                                    <h3 className="text-xl font-bold text-base-content">{META[type].title}</h3>
                                </div>
                                <button type="button" onClick={onClose} className="text-base-content/50 hover:text-base-content" aria-label="Close">
                                    <X size={20} />
                                </button>
                            </div>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/** Shared Cancel / primary footer */
export function ModalFooter({ onCancel, submitLabel, disabled, tone = "primary" }: { onCancel: () => void; submitLabel: React.ReactNode; disabled?: boolean; tone?: "primary" | "secondary" }) {
    return (
        <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onCancel} className="btn btn-ghost hover:bg-base-content/5 text-base-content/70">
                Cancel
            </button>
            <button
                type="submit"
                disabled={disabled}
                className={clsx(
                    "btn border-none px-6 disabled:opacity-50",
                    tone === "primary" ? "bg-primary hover:bg-primary/90 text-primary-content" : "bg-secondary hover:bg-secondary/80 text-white",
                )}
            >
                {submitLabel}
            </button>
        </div>
    );
}

export const FIELD = "w-full bg-base-300/40 text-lg text-base-content border border-base-content/10 rounded-xl p-4 focus:outline-none focus:border-base-content/40 transition-colors";
export const LABEL = "text-sm font-bold text-base-content/50 uppercase";
