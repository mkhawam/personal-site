"use client";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { Archive, BarChart, Bell, BrainCircuit, Cloud, Eye, Flame } from "lucide-react";
import type { ModalType, SyncStatus } from "../constants";
import MusicPanel from "./MusicPanel";

export type User = { username: string; avatar: string | null } | null;

type Props = {
    currentStreak: number;
    notificationsEnabled: boolean;
    onRequestNotifications: () => void;
    sync: { status: SyncStatus; unlocked: boolean; isSyncing: boolean; lastSyncTime: Date | null };
    user: User;
    onSyncClick: () => void;
    archivedCount: number;
    onOpen: (type: ModalType) => void;
    onZen: () => void;
};

const ICON_BTN = "btn btn-circle btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content";

/** Right-hand cluster of the desktop header. */
export default function HeaderActions({ currentStreak, notificationsEnabled, onRequestNotifications, sync, user, onSyncClick, archivedCount, onOpen, onZen }: Props) {
    const busy = sync.status === "syncing" || sync.isSyncing;
    const syncTone =
        busy ? "text-secondary animate-pulse"
        : sync.status === "error" ? "text-error"
        : sync.status === "dirty" ? "text-info"
        : sync.unlocked && user ? "text-success"
        : sync.unlocked && !user ? "text-warning"
        : "text-base-content/50";
    const syncTitle =
        busy ? "Syncing..."
        : sync.status === "error" ? "Sync paused — retrying"
        : sync.status === "dirty" ? "Unsynced changes — saving shortly"
        : sync.unlocked && user ? `Encrypted Sync Active${sync.lastSyncTime ? ` — synced ${formatDistanceToNow(sync.lastSyncTime, { addSuffix: true })}` : ""}`
        : sync.unlocked && !user ? "Session expired — click to login"
        : "Sync Disabled — click to login";

    return (
        <div className="flex gap-2 items-center">
            {currentStreak > 0 && (
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/20 border border-warning/30 rounded-full text-warning font-bold text-sm"
                    title={`${currentStreak} day streak! Keep it up!`}
                >
                    <Flame size={16} className="fill-warning" />
                    <span>{currentStreak}</span>
                </div>
            )}
            {!notificationsEnabled && (
                <button onClick={onRequestNotifications} className={ICON_BTN} title="Enable Notifications">
                    <Bell size={24} />
                </button>
            )}

            <button onClick={onSyncClick} className={clsx("btn btn-circle btn-ghost hover:bg-base-content/10 relative", syncTone)} title={syncTitle}>
                <Cloud size={24} />
                {sync.unlocked && (
                    <span
                        className={clsx(
                            "absolute bottom-2 right-2 w-2 h-2 rounded-full border border-base-100",
                            sync.status === "error" ? "bg-error"
                            : sync.status === "dirty" ? "bg-info"
                            : user ? "bg-success"
                            : "bg-warning",
                        )}
                    />
                )}
            </button>

            <MusicPanel />

            {user && (
                <div className="flex items-center gap-3 mr-4 pl-4 border-l border-base-content/10">
                    {user.avatar ?
                        // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar, no loader configured
                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-base-content/10" />
                    :   <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="text-sm font-medium text-base-content/70 hidden md:block">{user.username}</span>
                </div>
            )}

            <button onClick={() => onOpen("STATS")} className={ICON_BTN} title="Statistics">
                <BarChart size={24} />
            </button>
            <button onClick={onZen} className={ICON_BTN} title="Enter Zen Mode">
                <Eye size={24} />
            </button>
            <button onClick={() => onOpen("BRAINSTORM")} className={ICON_BTN} title="Brainstorm Mode">
                <BrainCircuit size={28} />
            </button>
            {archivedCount > 0 && (
                <button onClick={() => onOpen("ARCHIVE")} className={clsx(ICON_BTN, "relative")} title={`Archived Tasks (${archivedCount})`}>
                    <Archive size={24} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-base-300 rounded-full text-[10px] flex items-center justify-center text-base-content/70 border border-base-content/10">
                        {archivedCount}
                    </span>
                </button>
            )}
        </div>
    );
}
