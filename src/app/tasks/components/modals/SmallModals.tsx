"use client";

import { useState } from "react";
import { Lock, RotateCw, Trash2 } from "lucide-react";
import type { Task } from "../../types";
import NoteEditor from "../NoteEditor";
import { FIELD, LABEL, ModalFooter } from "./Modal";

/** One text field + submit. Used for subtasks and new lists. */
export function TextInputModal({ placeholder, submitLabel, onSubmit, onCancel }: { placeholder: string; submitLabel: string; onSubmit: (text: string) => void; onCancel: () => void }) {
    const [value, setValue] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (value.trim()) onSubmit(value.trim());
            }}
        >
            <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className={FIELD} autoFocus aria-label={placeholder} />
            <ModalFooter onCancel={onCancel} submitLabel={submitLabel} disabled={!value.trim()} />
        </form>
    );
}

export function AttachmentModal({ onSubmit, onCancel }: { onSubmit: (url: string, name: string) => void; onCancel: () => void }) {
    const [url, setUrl] = useState("");
    const [name, setName] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) onSubmit(url.trim(), name);
            }}
            className="space-y-4"
        >
            <div>
                <label className={LABEL}>
                    Link URL
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/..." className={`${FIELD} mt-2 font-normal normal-case`} autoFocus />
                </label>
            </div>
            <div>
                <label className={LABEL}>
                    Display Name (Optional)
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project Spec, Figma Board, etc." className={`${FIELD} mt-2 font-normal normal-case`} />
                </label>
            </div>
            <ModalFooter onCancel={onCancel} submitLabel="Add Link" disabled={!url.trim()} />
        </form>
    );
}

export function NoteModal({ initial, onSave, onCancel }: { initial: string; onSave: (text: string) => void; onCancel: () => void }) {
    const [draft, setDraft] = useState(initial);
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave(draft);
            }}
            className="flex flex-col gap-4 flex-1 min-h-0"
        >
            {/* Same markdown editor (with preview) as the Notes panel */}
            <div className="flex-1 min-h-0 flex flex-col bg-base-300/40 border border-base-content/10 rounded-xl overflow-hidden focus-within:border-base-content/40 transition-colors">
                <NoteEditor variant="desktop" content={draft} onChange={setDraft} autoFocus placeholder="Add details, links, or thoughts... (Markdown supported)" />
            </div>
            <div className="-mt-6">
                <ModalFooter onCancel={onCancel} submitLabel="Save Notes" />
            </div>
        </form>
    );
}

export function SyncModal({ isSyncing, onSubmit, onCancel }: { isSyncing: boolean; onSubmit: (password: string) => void; onCancel: () => void }) {
    const [password, setPassword] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(password);
            }}
            className="flex flex-col gap-4"
        >
            <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-secondary/20">
                    <Lock size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-base-content">Setup Secure Sync</h3>
                <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                    Enter a <span className="text-base-content/80 font-medium">Sync Password</span> to encrypt your data. This password never leaves your device.
                    Existing data will be downloaded, or your current tasks will be uploaded.
                </p>
            </div>
            <div>
                {/* Hidden username so password managers file the entry correctly */}
                <input type="text" name="username" value="Sync" readOnly autoComplete="username" className="hidden" />
                <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                    Sync Password
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your secret password..."
                        autoComplete="current-password"
                        className={`${FIELD} mt-2 font-normal normal-case focus:border-secondary`}
                        autoFocus
                    />
                </label>
            </div>
            <ModalFooter
                onCancel={onCancel}
                tone="secondary"
                disabled={!password || isSyncing}
                submitLabel={isSyncing ? <span className="loading loading-spinner loading-sm" /> : "Enable Sync"}
            />
        </form>
    );
}

type ArchiveProps = { archivedTasks: Task[]; deletedTasks: Task[]; onUnarchive: (id: string) => void; onDelete: (id: string) => void; onRestore: (id: string) => void };

export function ArchiveModal({ archivedTasks, deletedTasks, onUnarchive, onDelete, onRestore }: ArchiveProps) {
    return (
        <div className="space-y-4">
            {archivedTasks.length === 0 ?
                <div className="text-center text-base-content/50 py-8">No archived tasks found.</div>
            :   <div className="space-y-2">
                    {archivedTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-base-content/5 rounded-lg border border-base-content/5">
                            <span className="flex-1 text-base-content/70 line-through text-sm">{task.text}</span>
                            <button onClick={() => onUnarchive(task.id)} className="p-2 hover:bg-base-content/10 rounded text-base-content/50 hover:text-base-content" title="Restore">
                                <RotateCw size={14} />
                            </button>
                            <button onClick={() => onDelete(task.id)} className="p-2 hover:bg-error/20 rounded text-error/50 hover:text-error" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            }

            {deletedTasks.length > 0 && (
                <div className="pt-4 border-t border-base-content/5">
                    <h4 className="text-sm font-bold text-base-content/50 uppercase mb-3">Recently Deleted</h4>
                    <p className="text-xs text-base-content/40 mb-3">Purged automatically after 30 days.</p>
                    <div className="space-y-2">
                        {deletedTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-error/5 rounded-lg border border-error/10">
                                <span className="flex-1 text-base-content/50 line-through text-sm">{task.text}</span>
                                <button onClick={() => onRestore(task.id)} className="p-2 hover:bg-base-content/10 rounded text-base-content/50 hover:text-base-content" title="Restore">
                                    <RotateCw size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
    { keys: ["Space"], label: "Toggle Timer" },
    { keys: ["N"], label: "New Task" },
    { keys: ["Esc"], label: "Close / Exit Zen" },
    { keys: ["?"], label: "Shortcuts" },
    { keys: ["/"], label: "Search Tasks" },
    { keys: ["T"], label: "Today View" },
    { keys: ["[", "]"], label: "Prev / Next List" },
    { keys: ["⌘K"], label: "Command Palette" },
];

export function ShortcutsModal() {
    return (
        <div className="grid grid-cols-2 gap-4">
            {SHORTCUTS.map((s) => (
                <div key={s.label} className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                    <div className="flex gap-1 mb-2">
                        {s.keys.map((k) => (
                            <kbd key={k} className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10">
                                {k}
                            </kbd>
                        ))}
                    </div>
                    <span className="text-sm text-base-content/70">{s.label}</span>
                </div>
            ))}
        </div>
    );
}
