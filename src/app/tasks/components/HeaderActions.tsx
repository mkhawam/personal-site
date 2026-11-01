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

const ICON_BTN = "btn btn-square btn-ghost btn-sm hover:bg-base-content/8 text-base-content/55 hover:text-base-content";

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
        <div className="flex items-center gap-1">
            {currentStreak > 0 && (
                <div
                    className="flex items-center gap-1 h-8 px-2.5 mr-1 bg-warning/12 rounded-full text-warning font-semibold text-sm tabular-nums"
                    title={`${currentStreak}-day focus streak`}
                >
                    <Flame size={14} className="fill-warning" />
                    {currentStreak}d
                </div>
            )}
            {!notificationsEnabled && (
                <button onClick={onRequestNotifications} className={ICON_BTN} title="Enable timer notifications" aria-label="Enable timer notifications">
                    <Bell size={18} />
                </button>
            )}
            <button onClick={onSyncClick} className={clsx("btn btn-square btn-ghost btn-sm hover:bg-base-content/8 relative", syncTone)} title={syncTitle} aria-label={syncTitle}>
                <Cloud size={18} />
                {sync.unlocked && (
                    <span
                        className={clsx(
                            "absolute bottom-1 right-1 w-2 h-2 rounded-full ring-2 ring-base-100",
                            sync.status === "error" ? "bg-error"
                            : sync.status === "dirty" ? "bg-info"
                            : user ? "bg-success"
                            : "bg-warning",
                        )}
                    />
                )}
            </button>
            <MusicPanel />

            <span className="w-px h-5 bg-base-content/10 mx-1.5" aria-hidden />

            <button onClick={() => onOpen("STATS")} className={ICON_BTN} title="Statistics" aria-label="Statistics">
                <BarChart size={18} />
            </button>
            <button onClick={() => onOpen("BRAINSTORM")} className={ICON_BTN} title="Brainstorm" aria-label="Brainstorm">
                <BrainCircuit size={18} />
            </button>
            {archivedCount > 0 && (
                <button onClick={() => onOpen("ARCHIVE")} className={clsx(ICON_BTN, "relative")} title={`Archived tasks (${archivedCount})`} aria-label={`Archived tasks (${archivedCount})`}>
                    <Archive size={18} />
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-base-300 rounded-full text-[10px] leading-4 text-center tabular-nums text-base-content/70">
                        {archivedCount}
                    </span>
                </button>
            )}
            <button onClick={onZen} className={ICON_BTN} title="Zen mode: hide everything but the list" aria-label="Enter zen mode">
                <Eye size={18} />
            </button>

            {user && (
                <>
                    <span className="w-px h-5 bg-base-content/10 mx-1.5" aria-hidden />
                    <div className="flex items-center gap-2" title={`Signed in as ${user.username}`}>
                        {user.avatar ?
                            // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar, no loader configured
                            <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-full" />
                        :   <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-content">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        }
                        <span className="text-sm font-medium text-base-content/70 hidden xl:block">{user.username}</span>
                    </div>
                </>
            )}
        </div>
    );
}
