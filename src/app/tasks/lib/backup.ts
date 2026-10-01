import { format } from "date-fns";
import type { FocusHistoryEntry, NotePage, PomoSettings, SavedLink, TimerMode } from "../constants";
import type { Task, TaskList } from "../types";

export type BackupData = {
    tasks?: Task[];
    lists?: TaskList[];
    activeListId?: string;
    savedLinks?: SavedLink[];
    notePages?: NotePage[];
    settings?: { timeLeft?: number; mode?: TimerMode; isTimerMinimized?: boolean; pomoSettings?: PomoSettings };
    focusHistory?: FocusHistoryEntry[];
};

export function downloadBackup(data: BackupData) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(String(event.target?.result ?? ""));
                if (!parsed || typeof parsed !== "object") throw new Error("Not a backup");
                resolve(parsed as BackupData);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
}
