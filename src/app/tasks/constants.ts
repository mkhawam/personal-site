// Shared constants and small types for the tasks app. Task/List/Tag live in
// ./types.ts; this file holds everything that used to be module-level in page.tsx.

// Virtual cross-list "Today" view id — can't collide with real list ids
// (those are Date.now().toString(36)).
export const TODAY_LIST_ID = "__today__";

export const SOUNDS = {
    bell: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    digital: "https://assets.mixkit.co/active_storage/sfx/2864/2864-preview.mp3",
    nature: "https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3",
} as const;
export type SoundKey = keyof typeof SOUNDS;

export const RADIO_STATIONS = [
    { name: "Lo-fi Hip Hop", url: "https://streams.ilovemusic.de/iloveradio17.mp3", color: "bg-purple-500" },
    { name: "Chillhop", url: "https://streams.ilovemusic.de/iloveradio2.mp3", color: "bg-blue-500" },
    { name: "Jazz Vibes", url: "https://streams.ilovemusic.de/iloveradio10.mp3", color: "bg-amber-500" },
    { name: "Deep Focus", url: "https://streams.ilovemusic.de/iloveradio16.mp3", color: "bg-green-500" },
];

export type PomoSettings = {
    work: number;
    shortBreak: number;
    longBreak: number;
    interval: number;
    sound: SoundKey;
};

export const DEFAULT_SETTINGS: PomoSettings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    interval: 4,
    sound: "bell",
};

export type TimerMode = "work" | "break" | "longBreak";

export type FocusHistoryEntry = { date: string; minutes: number; tasksCompleted?: number };
export type NotePage = { id: string; title: string; content: string };
export type SavedLink = { id: string; title: string; url: string; createdAt: string };
export type SortMode = "manual" | "priority" | "due";
export type SyncStatus = "disabled" | "synced" | "syncing" | "dirty" | "error";

export type ModalType = "SUBTASK" | "NOTE" | "BRAINSTORM" | "SETTINGS" | "ARCHIVE" | "ATTACHMENT" | "SHORTCUTS" | "STATS" | "NEW_LIST" | "SYNC";

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
