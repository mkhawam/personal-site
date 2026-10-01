"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Cloud, Download, Lock, RefreshCw, Upload } from "lucide-react";
import { SOUNDS, type PomoSettings, type SoundKey } from "../../constants";
import { ModalFooter } from "./Modal";

type Props = {
    settings: PomoSettings;
    onSave: (next: PomoSettings) => void;
    onCancel: () => void;
    sync: { unlocked: boolean; hasSalt: boolean; lastSyncTime: Date | null; isSyncing: boolean; onOpen: () => void; onPullNow: () => void };
    onExport: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const NUM = "w-full bg-base-300/40 text-base-content border border-base-content/10 rounded-xl p-3 mt-1 focus:border-base-content/40 outline-none";
const LABEL = "text-sm font-bold text-base-content/50 uppercase";
const DATA_BTN =
    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-base-300/40 border border-base-content/10 text-base-content/70 hover:bg-base-content/5 hover:text-base-content/80 transition-colors";

export default function SettingsModal({ settings, onSave, onCancel, sync, onExport, onImport }: Props) {
    const [form, setForm] = useState<PomoSettings>(settings);
    const field = (key: "work" | "shortBreak" | "longBreak" | "interval", label: string) => (
        <div>
            <label className={LABEL}>
                {label}
                <input type="number" min={1} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} className={clsx(NUM, "font-normal normal-case text-base")} />
            </label>
        </div>
    );

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave({
                    work: Number(form.work) || 25,
                    shortBreak: Number(form.shortBreak) || 5,
                    longBreak: Number(form.longBreak) || 15,
                    interval: Number(form.interval) || 4,
                    sound: form.sound || "bell",
                });
            }}
            className="space-y-4"
        >
            <div className="grid grid-cols-2 gap-4">
                {field("work", "Work (min)")}
                {field("shortBreak", "Short Break")}
                {field("longBreak", "Long Break")}
                {field("interval", "Interval")}
            </div>
            <div className="text-xs text-base-content/50 mt-2">Long break triggers after every {form.interval} work sessions.</div>

            <div className="pt-4 border-t border-base-content/5">
                <div className={clsx(LABEL, "block mb-2")}>Alarm Sound</div>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(SOUNDS) as SoundKey[]).map((soundKey) => (
                        <button
                            key={soundKey}
                            type="button"
                            onClick={() => {
                                new Audio(SOUNDS[soundKey]).play().catch(() => {});
                                setForm({ ...form, sound: soundKey });
                            }}
                            className={clsx(
                                "p-3 rounded-xl border text-sm font-medium capitalize transition-all",
                                form.sound === soundKey ?
                                    "bg-primary text-primary-content border-primary"
                                :   "bg-base-300/40 text-base-content/70 border-base-content/10 hover:bg-base-content/5 hover:text-base-content/80",
                            )}
                        >
                            {soundKey}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-base-content/5">
                <div className={clsx(LABEL, "block mb-2")}>Data & Sync</div>
                <div className="flex flex-col gap-3">
                    {!sync.unlocked ?
                        <button
                            type="button"
                            onClick={sync.onOpen}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-secondary to-secondary/70 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-secondary/20"
                        >
                            {sync.hasSalt ?
                                <>
                                    <Lock size={18} /> Unlock Sync
                                </>
                            :   <>
                                    <Cloud size={18} /> Enable Secure Sync
                                </>
                            }
                        </button>
                    :   <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20 text-success">
                            <div className="flex items-center gap-2">
                                <Check size={16} />
                                <span className="text-sm font-medium">Sync Active</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {sync.lastSyncTime && <span className="text-xs opacity-70">{sync.lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                                <button type="button" onClick={sync.onPullNow} title="Pull latest from server" className="p-1 hover:bg-success/20 rounded-full transition-colors">
                                    <RefreshCw size={14} className={sync.isSyncing ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    }

                    <div className="flex gap-3">
                        <button type="button" onClick={onExport} className={DATA_BTN}>
                            <Download size={16} />
                            Export
                        </button>
                        <label className={clsx(DATA_BTN, "cursor-pointer")}>
                            <Upload size={16} />
                            Import
                            <input type="file" accept=".json" onChange={onImport} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            <ModalFooter onCancel={onCancel} submitLabel="Save Settings" />
        </form>
    );
}
