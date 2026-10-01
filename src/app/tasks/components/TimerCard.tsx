"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Settings } from "lucide-react";
import type { TimerMode } from "../constants";
import { formatTime, type Pomodoro } from "../hooks/usePomodoro";

const MODES: { id: TimerMode; label: string }[] = [
    { id: "work", label: "Work" },
    { id: "break", label: "Break" },
    { id: "longBreak", label: "Long Break" },
];

const STROKE = 283; // 2πr for r=45

type Props = {
    timer: Pomodoro;
    focusedTaskText?: string;
    onOpenSettings: () => void;
};

/** Desktop timer card: mode pills, progress ring, focused task, controls. */
export default function TimerCard({ timer, focusedTaskText, onOpenSettings }: Props) {
    return (
        <motion.div
            layout
            className="relative overflow-hidden rounded-3xl bg-base-content/5 backdrop-blur-xl border border-base-content/5 p-8 shadow-2xl flex flex-col items-center"
        >
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={onOpenSettings} className="text-base-content/50 hover:text-base-content/80 transition-colors" title="Timer Settings">
                    <Settings size={20} />
                </button>
                <button
                    onClick={() => timer.setIsMinimized(true)}
                    className="text-base-content/50 hover:text-base-content/80 transition-colors"
                    title="Minimize Timer"
                >
                    <Minimize2 size={20} />
                </button>
            </div>

            <div className="flex justify-center gap-2 mb-8 relative z-10 p-1 bg-base-300/40 rounded-full">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => timer.switchMode(m.id)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                            timer.mode === m.id ? "bg-primary text-primary-content shadow-lg" : "text-base-content/50 hover:text-base-content/80",
                        )}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="stroke-base-300 fill-none" strokeWidth="8" />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="stroke-primary fill-none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={STROKE}
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: STROKE * (1 - timer.progress) }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold tracking-tighter text-base-content tabular-nums">{formatTime(timer.timeLeft)}</div>
                    <div className="text-sm font-mono text-base-content/50 mt-2">
                        Session {(timer.sessionsCompleted % timer.settings.interval) + 1}/{timer.settings.interval}
                    </div>
                </div>
            </div>

            {focusedTaskText && (
                <div className="mb-6 px-4 py-3 bg-warning/10 border border-warning/20 rounded-xl text-center max-w-full">
                    <div className="text-xs text-warning/70 uppercase font-bold mb-1">Focusing On</div>
                    <div className="text-sm text-base-content/80 font-medium truncate">{focusedTaskText}</div>
                </div>
            )}

            <div className="flex justify-center gap-4 relative z-10 w-full">
                <button
                    onClick={timer.toggle}
                    className="btn btn-circle btn-lg bg-primary hover:bg-primary/90 text-primary-content border-none hover:scale-105 transition-all shadow-xl shadow-base-content/10"
                    aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
                >
                    {timer.isRunning ?
                        <Pause fill="currentColor" />
                    :   <Play fill="currentColor" className="ml-1" />}
                </button>
                <button
                    onClick={timer.reset}
                    className="btn btn-circle btn-lg btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content"
                    aria-label="Reset timer"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </motion.div>
    );
}

/** Compact header timer shown when the card is minimized. */
export function MiniTimer({ timer }: { timer: Pomodoro }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="hidden md:flex items-center gap-4 px-4 py-2 bg-base-content/5 rounded-2xl border border-base-content/5 backdrop-blur-md"
        >
            <span className="text-2xl font-bold text-base-content tabular-nums">{formatTime(timer.timeLeft)}</span>
            <div className="flex bg-base-300/50 rounded-lg p-1" title={timer.mode === "work" ? "Focus" : "Break"}>
                <div className={clsx("w-2 h-2 rounded-full mx-1", timer.mode === "work" ? "bg-primary" : "bg-base-300")} />
                <div className={clsx("w-2 h-2 rounded-full mx-1", timer.mode !== "work" ? "bg-primary" : "bg-base-300")} />
            </div>
            <button
                onClick={timer.toggle}
                className="btn btn-circle btn-sm bg-primary hover:bg-primary/90 text-primary-content border-none"
                aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
            >
                {timer.isRunning ?
                    <Pause size={14} fill="currentColor" />
                :   <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
                onClick={() => timer.setIsMinimized(false)}
                title="Expand Timer"
                className="btn btn-circle btn-sm btn-ghost hover:bg-base-content/10 text-base-content/70"
            >
                <Maximize2 size={16} />
            </button>
        </motion.div>
    );
}

/** Full-screen mobile Focus tab. */
export function MobileFocusTab({ timer }: { timer: Pomodoro }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="relative w-72 h-72 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="stroke-base-300 fill-none" strokeWidth="4" />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="stroke-primary fill-none"
                        strokeWidth="4"
                        strokeDasharray={STROKE}
                        strokeDashoffset={STROKE * (1 - timer.progress)}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="flex flex-col items-center">
                    <div className="text-6xl font-bold text-base-content tabular-nums">{formatTime(timer.timeLeft)}</div>
                    <div className="text-base-content/50 uppercase tracking-widest text-sm mt-2">{timer.mode === "longBreak" ? "long break" : timer.mode}</div>
                </div>
            </div>

            <button
                onClick={timer.toggle}
                className={clsx(
                    "btn btn-circle btn-xl w-24 h-24 shadow-2xl",
                    timer.isRunning ? "bg-base-300 text-error border-error/20" : "bg-primary text-primary-content",
                )}
                aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
            >
                {timer.isRunning ?
                    <Pause size={40} />
                :   <Play size={40} className="ml-2" />}
            </button>

            <div className="flex gap-2">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => timer.switchMode(m.id)}
                        className={clsx(
                            "px-5 py-2 rounded-full font-medium",
                            timer.mode === m.id ? "bg-base-content/10 text-base-content border border-base-content/20" : "text-base-content/50",
                        )}
                    >
                        {m.id === "work" ? "Focus" : m.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
