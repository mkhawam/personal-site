"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS, SOUNDS, type PomoSettings, type TimerMode } from "../constants";

/** Slice of timer state that gets persisted / synced. */
export type TimerPersisted = {
    timeLeft: number;
    endsAt: number | null;
    mode: TimerMode;
    isTimerMinimized: boolean;
    pomoSettings: PomoSettings;
    sessionsCompleted: number;
};

const MODE_LABEL: Record<TimerMode, string> = { work: "Focus", break: "Short Break", longBreak: "Long Break" };

export function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const durationOf = (mode: TimerMode, s: PomoSettings) => (mode === "work" ? s.work : mode === "break" ? s.shortBreak : s.longBreak) * 60;

type Options = {
    /** Fires once per finished work session with its length in minutes. */
    onWorkSessionComplete: (minutes: number) => void;
};

/**
 * Pomodoro timer. The remaining time is derived from a wall-clock end
 * timestamp while running (not a decremented counter), so background-tab
 * timer throttling can't make a session run long, and a session survives a
 * reload. `remaining` is only authoritative while paused.
 */
export function usePomodoro({ onWorkSessionComplete }: Options) {
    const [settings, setSettings] = useState<PomoSettings>(DEFAULT_SETTINGS);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [mode, setMode] = useState<TimerMode>("work");
    const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.work * 60);
    const [endsAt, setEndsAt] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [isMinimized, setIsMinimized] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isRunning = endsAt !== null;
    const timeLeft = isRunning ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : remaining;
    const totalTime = durationOf(mode, settings);
    const progress = totalTime > 0 ? Math.min(1, timeLeft / totalTime) : 0;

    useEffect(() => {
        audioRef.current = new Audio(SOUNDS[settings.sound] || SOUNDS.bell);
    }, [settings.sound]);

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "granted") setNotificationsEnabled(true);
    }, []);

    // Tick from the wall clock. Hidden tabs get throttled to ~1 tick/min, which
    // is fine: the display catches up instantly on visibility/focus.
    useEffect(() => {
        if (!isRunning) return;
        const tick = () => setNow(Date.now());
        tick();
        const id = setInterval(tick, 250);
        document.addEventListener("visibilitychange", tick);
        window.addEventListener("focus", tick);
        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", tick);
            window.removeEventListener("focus", tick);
        };
    }, [isRunning]);

    useEffect(() => {
        document.title = isRunning ? `(${formatTime(timeLeft)}) ${MODE_LABEL[mode]}` : "Workflow";
    }, [isRunning, timeLeft, mode]);

    // Latest values for the completion handler, which must not re-subscribe
    // every second.
    const latest = useRef({ settings, sessionsCompleted, mode, notificationsEnabled, onWorkSessionComplete });
    latest.current = { settings, sessionsCompleted, mode, notificationsEnabled, onWorkSessionComplete };

    useEffect(() => {
        if (!isRunning || timeLeft > 0) return;
        const { settings, sessionsCompleted, mode, notificationsEnabled, onWorkSessionComplete } = latest.current;
        const notify = (title: string, body: string) => {
            if (notificationsEnabled && "Notification" in window) new Notification(title, { body });
        };

        setEndsAt(null);
        audioRef.current?.play().catch((e) => console.log("Audio play failed", e));

        if (mode === "work") {
            const n = sessionsCompleted + 1;
            setSessionsCompleted(n);
            onWorkSessionComplete(settings.work);

            if (n % settings.interval === 0) {
                setMode("longBreak");
                setRemaining(settings.longBreak * 60);
                toast.success(`Great job! You've done ${n} sessions.`, { description: `Take a ${settings.longBreak}m long break.` });
                notify("Long Break!", `Great job! You've done ${n} sessions. Take ${settings.longBreak}m.`);
            } else {
                setMode("break");
                setRemaining(settings.shortBreak * 60);
                toast.success("Focus Session Complete!", { description: "Time to recharge." });
                notify("Short Break!", "Time to recharge.");
            }
        } else {
            setMode("work");
            setRemaining(settings.work * 60);
            toast.info("Break Over!", { description: "Ready to focus?" });
            notify("Back to Work!", "Ready to focus?");
        }
    }, [isRunning, timeLeft]);

    const start = useCallback(() => {
        setNow(Date.now());
        setEndsAt((e) => e ?? Date.now() + remaining * 1000);
    }, [remaining]);

    const pause = useCallback(() => {
        if (endsAt === null) return;
        setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
        setEndsAt(null);
    }, [endsAt]);

    const toggle = useCallback(() => (endsAt === null ? start() : pause()), [endsAt, start, pause]);

    const reset = useCallback(() => {
        setEndsAt(null);
        setRemaining(durationOf(mode, settings));
    }, [mode, settings]);

    const switchMode = useCallback(
        (m: TimerMode) => {
            setMode(m);
            setEndsAt(null);
            setRemaining(durationOf(m, settings));
        },
        [settings],
    );

    /** Save new durations; a paused timer picks up the new length immediately. */
    const applySettings = useCallback(
        (next: PomoSettings) => {
            setSettings(next);
            if (endsAt === null) setRemaining(durationOf(mode, next));
        },
        [endsAt, mode],
    );

    const hydrate = useCallback((p: Partial<TimerPersisted>) => {
        if (p.pomoSettings) setSettings(p.pomoSettings);
        if (typeof p.sessionsCompleted === "number") setSessionsCompleted(p.sessionsCompleted);
        if (p.mode) setMode(p.mode);
        if (typeof p.isTimerMinimized === "boolean") setIsMinimized(p.isTimerMinimized);
        if (typeof p.endsAt === "number") {
            // Still running when the tab closed: resume, or complete if it elapsed meanwhile.
            setNow(Date.now());
            setEndsAt(p.endsAt);
        } else {
            setEndsAt(null);
            if (typeof p.timeLeft === "number") setRemaining(p.timeLeft);
        }
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            toast.error("This browser does not support notifications.");
            return;
        }
        if (Notification.permission === "denied") {
            toast.error("Notifications are blocked.", { description: "Please enable them in your browser settings." });
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setNotificationsEnabled(true);
            toast.success("Notifications enabled!");
            new Notification("Hello!", { body: "You will now receive alerts for your timer." });
        }
    }, []);

    // Identity only changes on real state changes — never once a second — so the
    // persistence effect that depends on it doesn't write localStorage per tick.
    const persisted = useMemo<TimerPersisted>(
        () => ({
            timeLeft: endsAt === null ? remaining : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)),
            endsAt,
            mode,
            isTimerMinimized: isMinimized,
            pomoSettings: settings,
            sessionsCompleted,
        }),
        [remaining, endsAt, mode, isMinimized, settings, sessionsCompleted],
    );

    return {
        settings,
        applySettings,
        sessionsCompleted,
        mode,
        isRunning,
        timeLeft,
        totalTime,
        progress,
        isMinimized,
        setIsMinimized,
        notificationsEnabled,
        requestNotificationPermission,
        toggle,
        reset,
        switchMode,
        hydrate,
        persisted,
    };
}

export type Pomodoro = ReturnType<typeof usePomodoro>;
