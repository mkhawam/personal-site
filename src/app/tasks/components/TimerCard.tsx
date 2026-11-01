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

const MODE_LABEL: Record<TimerMode, string> = { work: "Focus", break: "Short break", longBreak: "Long break" };

const STROKE = 283; // 2πr for r=45

// Focus runs on the accent; breaks switch the ring green so the mode reads at a glance.
const ringStroke = (mode: TimerMode) => (mode === "work" ? "stroke-primary" : "stroke-success");

const CORNER_BTN = "p-1.5 rounded-md text-base-content/50 hover:text-base-content hover:bg-base-content/8 transition-colors";

/** One pip per work session in the long-break cycle; filled = done this cycle. */
function SessionPips({ done, total }: { done: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5 mt-3" title={`Session ${done + 1} of ${total} before a long break`} aria-label={`Session ${done + 1} of ${total}`}>
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={clsx("w-1.5 h-1.5 rounded-full", i < done ? "bg-primary" : i === done ? "bg-base-content/45" : "bg-base-content/15")}
                />
            ))}
        </div>
    );
}

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
            className="relative overflow-hidden rounded-2xl bg-base-200 border border-base-content/8 px-6 pt-5 pb-7 shadow-sm flex flex-col items-center"
        >
            <div className="w-full flex items-center justify-between mb-6">
                <div className="flex gap-1 p-1 bg-base-content/5 rounded-full">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => timer.switchMode(m.id)}
                        className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                            timer.mode === m.id ? "bg-base-100 text-base-content shadow-sm" : "text-base-content/55 hover:text-base-content/80",
                        )}
                        aria-pressed={timer.mode === m.id}
                    >
                        {m.label}
                    </button>
                ))}
                </div>
                <div className="flex gap-0.5">
                    <button onClick={onOpenSettings} className={CORNER_BTN} title="Timer settings" aria-label="Timer settings">
                        <Settings size={16} />
                    </button>
                    <button onClick={() => timer.setIsMinimized(true)} className={CORNER_BTN} title="Minimize timer" aria-label="Minimize timer">
                        <Minimize2 size={16} />
                    </button>
                </div>
            </div>

            <div className="relative w-60 h-60 mb-6 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="stroke-base-content/8 fill-none" strokeWidth="5" />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        className={clsx("fill-none", ringStroke(timer.mode))}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={STROKE}
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: STROKE * (1 - timer.progress) }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-1">{MODE_LABEL[timer.mode]}</div>
                    <div className="text-6xl font-semibold tracking-tight text-base-content tabular-nums">{formatTime(timer.timeLeft)}</div>
                    <SessionPips done={timer.sessionsCompleted % timer.settings.interval} total={timer.settings.interval} />
                </div>
            </div>

            <div className="w-full mb-6 px-4 py-2.5 rounded-xl text-center bg-base-content/4 border border-base-content/6">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-base-content/45 mb-0.5">{focusedTaskText ? "Focusing on" : "No task in focus"}</div>
                <div className={clsx("text-sm font-medium truncate", focusedTaskText ? "text-base-content" : "text-base-content/50")}>
                    {focusedTaskText ?? "Use the target on a task to log sessions to it"}
                </div>
            </div>

            <div className="flex items-center justify-center gap-3 w-full">
                <span className="w-10" aria-hidden />
                <button
                    onClick={timer.toggle}
                    className="btn btn-circle btn-lg bg-primary hover:bg-primary/90 text-primary-content border-none transition-colors"
                    aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
                >
                    {timer.isRunning ?
                        <Pause fill="currentColor" />
                    :   <Play fill="currentColor" className="ml-1" />}
                </button>
                <button
                    onClick={timer.reset}
                    className="btn btn-circle btn-ghost hover:bg-base-content/8 text-base-content/50 hover:text-base-content"
                    aria-label="Reset timer"
                    title="Reset timer"
                >
                    <RotateCcw size={18} />
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
                        className={clsx("fill-none", ringStroke(timer.mode))}
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
