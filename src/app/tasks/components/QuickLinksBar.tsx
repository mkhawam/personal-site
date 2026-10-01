"use client";

import { useState } from "react";
import clsx from "clsx";
import { FileText, Globe, X } from "lucide-react";
import { toast } from "sonner";
import type { SavedLink } from "../constants";

type Props = {
    links: SavedLink[];
    onAdd: (link: SavedLink) => void;
    onRemove: (id: string) => void;
    notesOpen: boolean;
    onToggleNotes: () => void;
};

export default function QuickLinksBar({ links, onAdd, onRemove, notesOpen, onToggleNotes }: Props) {
    const [draft, setDraft] = useState("");

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const raw = draft.trim();
        if (!raw) return;
        const url = raw.startsWith("http") ? raw : `https://${raw}`;
        try {
            const hostname = new URL(url).hostname.replace("www.", "");
            onAdd({ id: Date.now().toString(36), title: hostname, url, createdAt: new Date().toISOString() });
            setDraft("");
            toast.success("Link added!");
        } catch {
            toast.error("Invalid URL");
        }
    };

    return (
        <div className="shrink-0 flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                {links.slice(0, 8).map((link) => (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-base-content/5 hover:bg-base-content/10 rounded-lg text-sm text-base-content/70 hover:text-base-content/80 whitespace-nowrap transition-colors group"
                    >
                        <Globe size={12} className="flex-shrink-0" />
                        {link.title}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemove(link.id);
                            }}
                            className="text-base-content/30 hover:text-error opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Remove ${link.title}`}
                        >
                            <X size={12} />
                        </button>
                    </a>
                ))}
                {links.length === 0 && <span className="text-base-content/50 text-sm">No quick links yet</span>}
            </div>

            <form onSubmit={submit} className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="+ Add link..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-40 bg-transparent text-base-content/70 text-sm px-3 py-1.5 border border-base-content/10 rounded-lg focus:outline-none focus:border-base-content/40"
                    aria-label="Add quick link"
                />
            </form>

            <button
                onClick={onToggleNotes}
                className={clsx(
                    "p-2 rounded-lg transition-colors",
                    notesOpen ? "bg-warning/20 text-warning" : "text-base-content/50 hover:text-base-content/80 hover:bg-base-content/5",
                )}
                title="Toggle Notes Panel"
                aria-pressed={notesOpen}
            >
                <FileText size={20} />
            </button>
        </div>
    );
}
