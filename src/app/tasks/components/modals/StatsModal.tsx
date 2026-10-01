"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Flame, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { generateSummary } from "@/lib/ai";
import type { FocusHistoryEntry } from "../../constants";
import type { Task, TaskList } from "../../types";
import StatsExtras from "../StatsExtras";

type Props = {
    tasks: Task[];
    lists: TaskList[];
    completedTasks: Task[];
    focusHistory: FocusHistoryEntry[];
    sessionsCompleted: number;
    currentStreak: number;
    todayStr: string;
};

const CARD = "p-6 bg-base-content/5 rounded-2xl border border-base-content/5";

export default function StatsModal({ tasks, lists, completedTasks, focusHistory, sessionsCompleted, currentStreak, todayStr }: Props) {
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState("");
    const today = focusHistory.find((h) => h.date === todayStr);
    const maxMin = Math.max(...focusHistory.map((h) => h.minutes), 60); // scale to the busiest day, at least 60m

    const generate = () => {
        setAiLoading(true);
        setAiResult("");
        generateSummary(completedTasks, today?.minutes || 0)
            .then(setAiResult)
            .catch(() => toast.error("Failed to generate summary"))
            .finally(() => setAiLoading(false));
    };

    return (
        <div className="space-y-6">
            <div className={CARD}>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-base-content/80">Daily Summary</h4>
                    {!aiResult && (
                        <button
                            onClick={generate}
                            className="text-xs px-3 py-1.5 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                            disabled={aiLoading}
                        >
                            {aiLoading ?
                                "Generating..."
                            :   <>
                                    <Sparkles size={12} /> Generate with AI
                                </>
                            }
                        </button>
                    )}
                </div>
                {aiLoading && (
                    <div className="py-8 flex justify-center">
                        <span className="loading loading-spinner text-success" />
                    </div>
                )}
                {aiResult && (
                    <div className="prose prose-sm max-w-none bg-base-300/40 p-4 rounded-xl border border-base-content/5">
                        <ReactMarkdown>{aiResult}</ReactMarkdown>
                        <div className="flex justify-end mt-2">
                            <button onClick={() => setAiResult("")} className="text-xs text-base-content/50 hover:text-base-content/80">
                                Clear
                            </button>
                        </div>
                    </div>
                )}
                {!aiLoading && !aiResult && <div className="text-sm text-base-content/50 text-center py-4 italic">Generate a summary of your achievements today.</div>}
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Focus Today", value: today?.minutes || 0, unit: "min" },
                    { label: "Tasks Finished", value: today?.tasksCompleted || 0 },
                    { label: "Total Sessions", value: sessionsCompleted },
                ].map((tile) => (
                    <div key={tile.label} className="p-4 bg-base-content/5 rounded-xl border border-base-content/5">
                        <div className="text-xs text-base-content/50 uppercase font-bold truncate">{tile.label}</div>
                        <div className="text-2xl md:text-3xl font-extrabold text-base-content">
                            {tile.value}
                            {tile.unit && <span className="text-sm text-base-content/50 font-normal ml-1">{tile.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <StatsExtras tasks={tasks} lists={lists} />

            <div className={CARD}>
                <h4 className="text-lg font-bold text-base-content/80 mb-6">Last 7 Days</h4>
                <div className="flex items-end justify-between h-48 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const minutes = focusHistory.find((h) => h.date === format(d, "yyyy-MM-dd"))?.minutes ?? 0;
                        const height = Math.max((minutes / maxMin) * 100, 4);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                                <div className="relative w-full flex items-end justify-center">
                                    <div className="w-full bg-base-300/50 hover:bg-primary/90 transition-all rounded-md" style={{ height: `${height}%` }} />
                                    <div className="absolute -top-8 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {minutes} min
                                    </div>
                                </div>
                                <div className="text-xs text-base-content/50 mt-3 font-mono">{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={CARD}>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-base-content/80">Activity Heatmap</h4>
                    {currentStreak > 0 && (
                        <div className="flex items-center gap-1.5 text-warning text-sm font-bold">
                            <Flame size={14} className="fill-warning" />
                            <span>{currentStreak} day streak</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-12 gap-1">
                    {Array.from({ length: 84 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (83 - i));
                        const entry = focusHistory.find((h) => h.date === format(d, "yyyy-MM-dd"));
                        const minutes = entry?.minutes ?? 0;
                        const done = entry?.tasksCompleted ?? 0;
                        let bg = "bg-base-300/50";
                        if (minutes > 0 || done > 0) {
                            const intensity = Math.min(minutes / 60, 1);
                            bg =
                                intensity > 0.7 ? "bg-success"
                                : intensity > 0.4 ? "bg-success/70"
                                : intensity > 0.1 ? "bg-success/45"
                                : "bg-success/20";
                        }
                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-sm ${bg} hover:ring-2 hover:ring-base-content/40 transition-all cursor-default group relative`}
                                title={`${d.toLocaleDateString()}: ${minutes}min, ${done} tasks`}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {minutes}m, {done} tasks
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-2 mt-3 text-xs text-base-content/50">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {["bg-base-300/50", "bg-success/20", "bg-success/45", "bg-success/70", "bg-success"].map((c) => (
                            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
