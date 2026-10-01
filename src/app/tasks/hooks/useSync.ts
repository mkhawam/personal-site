"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { decryptData, deriveKey, encryptData, exportKey, importJWK } from "@/lib/client-crypto";
import type { NotePage, PomoSettings, SavedLink, SyncStatus, TimerMode } from "../constants";
import { mergeLists, mergeTasks } from "../lib/merge";
import type { Task, TaskList } from "../types";

/** The slice of app state that is encrypted and synced. */
export type SyncedSlice = {
    tasks: Task[];
    lists: TaskList[];
    activeListId: string;
    savedLinks: SavedLink[];
    notePages: NotePage[];
    pomoSettings: PomoSettings;
};

type TimerSettings = { timeLeft?: number; mode?: TimerMode; isTimerMinimized?: boolean };

type RemoteBlob = SyncedSlice & { settings?: TimerSettings & { pomoSettings?: PomoSettings }; updatedAt?: string };

type Options = {
    slice: SyncedSlice;
    apply: {
        setTasks: (fn: (prev: Task[]) => Task[]) => void;
        setLists: (fn: (prev: TaskList[]) => TaskList[]) => void;
        setActiveListId: (id: string) => void;
        setSavedLinks: (links: SavedLink[]) => void;
        setNotePages: (pages: NotePage[]) => void;
        setPomoSettings: (s: PomoSettings) => void;
        applyTimerSettings: (s: TimerSettings) => void;
    };
    /** Volatile timer state included in pushes but excluded from dirtiness. */
    timerSnapshot: () => Required<TimerSettings>;
    /** Session expired: clear the user and (optionally) bounce to login. */
    onAuthLost: (redirect: boolean) => void;
};

function makeSalt(): string {
    if ("randomUUID" in window.crypto) return window.crypto.randomUUID();
    // Fallback for browsers without randomUUID (e.g. non-secure contexts)
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
    );
}

/**
 * End-to-end encrypted sync against /api/sync: debounced push on change,
 * 30s polling pull, per-task last-write-wins merge, echo suppression via a
 * snapshot of the last pushed/merged payload. All async callbacks read
 * through refs so polling never sees stale state.
 */
export function useSync({ slice, apply, timerSnapshot, onAuthLost }: Options) {
    const [syncKey, setSyncKey] = useState<CryptoKey | null>(null);
    const [syncSalt, setSyncSalt] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("disabled");

    const sliceRef = useRef(slice);
    sliceRef.current = slice;
    const applyRef = useRef(apply);
    applyRef.current = apply;
    const timerRef = useRef(timerSnapshot);
    timerRef.current = timerSnapshot;
    const authLostRef = useRef(onAuthLost);
    authLostRef.current = onAuthLost;
    const lastSyncTimeRef = useRef(lastSyncTime);
    lastSyncTimeRef.current = lastSyncTime;
    const isSyncingRef = useRef(isSyncing);
    isSyncingRef.current = isSyncing;

    const syncInitialized = useRef(false);
    // Echo suppression: snapshot of exactly what was last pushed or merged.
    const lastSyncedSnapshot = useRef<string | null>(null);
    const snapshotOf = (d: SyncedSlice) => JSON.stringify(d);
    // Refs only, so this is stable and safe inside the memoized callbacks below.
    const isDirty = useCallback(() => lastSyncedSnapshot.current !== null && snapshotOf(sliceRef.current) !== lastSyncedSnapshot.current, []);

    // Quiet error policy: one toast when sync breaks, one when it recovers.
    const consecutiveFailures = useRef(0);
    const reportFailure = () => {
        consecutiveFailures.current += 1;
        setSyncStatus("error");
        if (consecutiveFailures.current === 1) toast.warning("Sync paused — will retry");
    };
    const reportSuccess = () => {
        if (consecutiveFailures.current > 0) toast.success("Sync restored");
        consecutiveFailures.current = 0;
    };

    // Load persisted key/salt on mount
    useEffect(() => {
        const savedSalt = localStorage.getItem("workflow-sync-salt");
        if (savedSalt) setSyncSalt(savedSalt);

        const savedKeyJWK = localStorage.getItem("workflow-sync-key");
        if (savedKeyJWK) {
            try {
                importJWK(JSON.parse(savedKeyJWK))
                    .then((key) => {
                        setSyncKey(key);
                        toast.success("Sync unlocked automatically");
                    })
                    .catch((e) => console.error("Failed to import key", e));
            } catch {
                console.error("Invalid JWK in storage");
            }
        }
    }, []);

    const pullSync = useCallback(async (key: CryptoKey, force = false) => {
        try {
            const res = await fetch(`/api/sync?t=${Date.now()}`, { cache: "no-store" });
            if (res.status === 401) {
                console.warn("Pull Sync: Not authenticated");
                authLostRef.current(false);
                return;
            }
            if (!res.ok) {
                console.error("Pull Sync Error Response", res.status, res.statusText);
                reportFailure();
                return;
            }

            const data = await res.json();
            if (data.empty) {
                syncInitialized.current = true; // nothing remote yet — local may push
                return;
            }
            if (!data.encryptedData || !data.iv) {
                console.error("Invalid sync data format received");
                reportFailure();
                return;
            }

            const remoteTime = new Date(data.updatedAt);
            if (!force && lastSyncTimeRef.current && remoteTime <= lastSyncTimeRef.current) {
                syncInitialized.current = true; // up to date
                reportSuccess();
                setSyncStatus((prev) => (prev === "dirty" || prev === "syncing" ? prev : "synced"));
                return;
            }

            const decrypted = (await decryptData(data.encryptedData, data.iv, key)) as RemoteBlob;
            if (!decrypted.tasks || !decrypted.lists) {
                console.error("Decrypted data invalid structure");
                reportFailure();
                return;
            }

            // Merge instead of replace: per-task LWW keeps local edits the remote
            // blob doesn't know about yet (they push on the next debounce).
            const local = sliceRef.current;
            const a = applyRef.current;
            const localClean = !isDirty();

            a.setTasks((prev) => mergeTasks(prev, decrypted.tasks));
            a.setLists((prev) => mergeLists(prev, decrypted.lists));
            // Notes/links/settings have no per-item timestamps — apply remote only
            // when local has no unsynced changes (documented trade-off).
            if (decrypted.activeListId && localClean) a.setActiveListId(decrypted.activeListId);
            if (decrypted.savedLinks && localClean) a.setSavedLinks(decrypted.savedLinks);
            if (decrypted.notePages && localClean) a.setNotePages(decrypted.notePages);
            if (decrypted.settings?.pomoSettings && localClean) a.setPomoSettings(decrypted.settings.pomoSettings);

            // Snapshot from the values in hand (state updates are async). If the
            // merge kept local-only edits, the snapshot differs from state and the
            // push effect fires naturally, completing conflict resolution.
            lastSyncedSnapshot.current = snapshotOf({
                tasks: decrypted.tasks,
                lists: decrypted.lists,
                activeListId: decrypted.activeListId ?? local.activeListId,
                savedLinks: localClean ? (decrypted.savedLinks ?? local.savedLinks) : local.savedLinks,
                notePages: localClean ? (decrypted.notePages ?? local.notePages) : local.notePages,
                pomoSettings: localClean ? (decrypted.settings?.pomoSettings ?? local.pomoSettings) : local.pomoSettings,
            });

            setLastSyncTime(remoteTime);
            syncInitialized.current = true;
            reportSuccess();
            setSyncStatus("synced");
        } catch (e) {
            console.error("Pull Sync Exception", e);
            reportFailure();
        }
    }, [isDirty]);

    const performSync = useCallback(
        async (key: CryptoKey, saltStr: string) => {
            const current = sliceRef.current;
            const dataToEncrypt: RemoteBlob = {
                ...current,
                settings: { ...timerRef.current(), pomoSettings: current.pomoSettings },
                updatedAt: new Date().toISOString(),
            };

            setSyncStatus("syncing");
            const { cipherText, iv } = await encryptData(dataToEncrypt, key);

            const res = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encryptedData: cipherText,
                    salt: saltStr,
                    iv,
                    version: 1,
                    // Lets the server detect a newer remote version (409)
                    lastUpdated: lastSyncTimeRef.current ? lastSyncTimeRef.current.toISOString() : null,
                }),
            });

            if (res.status === 409) {
                // Server has newer data — pull merges it in; the still-dirty snapshot
                // re-triggers the push, resolving the conflict in one round trip.
                console.warn("Sync Conflict Detected: Server has newer data. Merging...");
                await pullSync(key, true);
                return;
            }
            if (!res.ok) {
                console.error("Sync Push Error:", await res.json().catch(() => ({})));
                reportFailure();
                return;
            }

            // Push accepted — this exact payload is now the server state.
            lastSyncedSnapshot.current = snapshotOf(current);
            setLastSyncTime(new Date());
            reportSuccess();
            setSyncStatus("synced");
        },
        [pullSync],
    );

    /** Enable or unlock sync with a password. Resolves true when the dialog can close. */
    const setupSync = useCallback(
        async (password: string): Promise<boolean> => {
            try {
                setIsSyncing(true);
                const res = await fetch("/api/sync");
                if (res.status === 401) {
                    authLostRef.current(true);
                    return false;
                }
                const serverData = await res.json();

                // Server salt wins when the server has data; otherwise reuse the local
                // salt (unlock on a fresh server) or mint a new one.
                let salt: string | null = serverData.salt || syncSalt || null;
                let key: CryptoKey;

                if (serverData.encryptedData && salt) {
                    key = await deriveKey(password, salt);
                    try {
                        const decrypted = (await decryptData(serverData.encryptedData, serverData.iv, key)) as RemoteBlob | null;
                        if (decrypted) {
                            const a = applyRef.current;
                            if (decrypted.tasks) a.setTasks((prev) => mergeTasks(prev, decrypted.tasks));
                            if (decrypted.lists) a.setLists((prev) => mergeLists(prev, decrypted.lists));
                            if (decrypted.activeListId) a.setActiveListId(decrypted.activeListId);
                            if (decrypted.savedLinks) a.setSavedLinks(decrypted.savedLinks);
                            if (decrypted.notePages) a.setNotePages(decrypted.notePages);
                            if (decrypted.settings) {
                                if (decrypted.settings.pomoSettings) a.setPomoSettings(decrypted.settings.pomoSettings);
                                a.applyTimerSettings(decrypted.settings);
                            }
                            const date = new Date(decrypted.updatedAt || Date.now());
                            setLastSyncTime(date);
                            toast.success(`Synced! (Last update: ${date.toLocaleTimeString()})`);
                        }
                    } catch {
                        toast.error("Incorrect password (decryption failed)");
                        return false;
                    }
                } else {
                    if (!salt) salt = makeSalt();
                    key = await deriveKey(password, salt);
                    await performSync(key, salt); // initial upload
                    toast.success("Sync enabled & data uploaded!");
                }

                setSyncKey(key);
                setSyncSalt(salt);
                localStorage.setItem("workflow-sync-salt", salt);
                localStorage.setItem("workflow-sync-key", JSON.stringify(await exportKey(key)));
                return true;
            } catch (e) {
                console.error("Sync Setup Error:", e);
                toast.error(`Sync setup failed: ${e instanceof Error ? e.message : String(e)}`);
                return false;
            } finally {
                setIsSyncing(false);
            }
        },
        [syncSalt, performSync],
    );

    // Auto push (debounced) whenever the synced slice changes
    useEffect(() => {
        if (!syncKey || !syncSalt || isSyncingRef.current) return;
        // Never push before a first successful pull — stale local data must not
        // overwrite the server on initial load.
        if (!syncInitialized.current) return;
        if (lastSyncedSnapshot.current !== null && snapshotOf(slice) === lastSyncedSnapshot.current) return;

        setSyncStatus("dirty");
        const timeoutId = setTimeout(() => performSync(syncKey, syncSalt), 5000);
        return () => clearTimeout(timeoutId);
    }, [slice, syncKey, syncSalt, performSync]);

    // Baseline status tracks whether sync is unlocked at all
    useEffect(() => {
        setSyncStatus(syncKey ? "synced" : "disabled");
    }, [syncKey]);

    // Poll
    useEffect(() => {
        if (!syncKey || !syncSalt) return;
        pullSync(syncKey);
        const interval = setInterval(() => pullSync(syncKey), 30000);
        return () => clearInterval(interval);
    }, [syncKey, syncSalt, pullSync]);

    /** Merge-safe forced pull with the key already in memory (manual refresh). */
    const pullNow = useCallback(
        async (force = true, quiet = false) => {
            if (!syncKey) return;
            setIsSyncing(true);
            await pullSync(syncKey, force);
            setIsSyncing(false);
            if (!quiet) toast.success("Pulled latest data");
        },
        [syncKey, pullSync],
    );

    return { syncKey, syncSalt, isSyncing, lastSyncTime, syncStatus, setupSync, pullNow };
}

export type Sync = ReturnType<typeof useSync>;
