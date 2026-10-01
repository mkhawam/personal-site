"use client";

import clsx from "clsx";
import { Archive, BarChart, Clock, Cloud, FileText, Home, Keyboard, Menu, Settings, Sparkles } from "lucide-react";
import type { ModalType } from "../constants";

export type MobileTab = "tasks" | "focus" | "notes" | "menu";

const TABS: { id: MobileTab; label: string; Icon: typeof Home }[] = [
    { id: "tasks", label: "Tasks", Icon: Home },
    { id: "focus", label: "Focus", Icon: Clock },
    { id: "notes", label: "Notes", Icon: FileText },
    { id: "menu", label: "Menu", Icon: Menu },
];

export function MobileBottomNav({ tab, onChange }: { tab: MobileTab; onChange: (t: MobileTab) => void }) {
    return (
        <nav className="w-full bg-base-100/95 backdrop-blur-xl border-t border-base-content/10 grid grid-cols-4 shrink-0 min-h-16 pb-safe" aria-label="App sections">
            {TABS.map(({ id, label, Icon }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={clsx(
                        "flex flex-col items-center justify-center gap-0.5 active:bg-base-content/5 transition-colors",
                        tab === id ? "text-base-content" : "text-base-content/50",
                    )}
                    aria-current={tab === id ? "page" : undefined}
                >
                    <Icon size={20} strokeWidth={tab === id ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{label}</span>
                </button>
            ))}
        </nav>
    );
}

type MenuProps = { onOpen: (type: ModalType) => void; onSync: () => void };

const TILE = "p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform";

export function MobileMenuTab({ onOpen, onSync }: MenuProps) {
    const items: { label: string; icon: React.ReactNode; tone: string; run: () => void }[] = [
        { label: "Settings", icon: <Settings size={20} />, tone: "bg-base-300 text-base-content", run: () => onOpen("SETTINGS") },
        { label: "Stats", icon: <BarChart size={20} />, tone: "bg-info/20 text-info", run: () => onOpen("STATS") },
        { label: "Sync Data", icon: <Cloud size={20} />, tone: "bg-secondary/20 text-secondary", run: onSync },
        { label: "Archive", icon: <Archive size={20} />, tone: "bg-warning/20 text-warning", run: () => onOpen("ARCHIVE") },
        { label: "Brainstorm", icon: <Sparkles size={20} />, tone: "bg-secondary/20 text-secondary", run: () => onOpen("BRAINSTORM") },
        { label: "Shortcuts", icon: <Keyboard size={20} />, tone: "bg-success/20 text-success", run: () => onOpen("SHORTCUTS") },
    ];
    return (
        <div className="grid grid-cols-2 gap-3 p-4">
            {items.map((item) => (
                <button key={item.label} onClick={item.run} className={TILE}>
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", item.tone)}>{item.icon}</div>
                    <span className="font-medium text-base-content/80">{item.label}</span>
                </button>
            ))}
        </div>
    );
}
