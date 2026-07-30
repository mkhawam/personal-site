"use client";

import clsx from "clsx";
import { addDays, format } from "date-fns";
import { localToday } from "../lib/dates";
import { TASK_TAGS, type Task, type TaskList } from "../types";

type Props = {
    tasks: Task[];
    lists: TaskList[];
};

// Extra Stats-modal sections, all derived from live task state. Counts reflect
// current data, not all-time: recurring resets zero out actualPomos, and
// deleted/purged tasks drop out. Archived tasks are included to widen samples.
export default function StatsExtras({ tasks, lists }: Props) {
    const live = tasks.filter((t) => !t.deletedAt);
    const todayStr = localToday();

    // --- Estimate accuracy ---
    const estimated = live.filter((t) => t.completed && t.estimatedPomos);
    const sumEst = estimated.reduce((s, t) => s + (t.estimatedPomos || 0), 0);
    const sumAct = estimated.reduce((s, t) => s + (t.actualPomos || 0), 0);
    const accuracy = sumEst > 0 ? Math.round((sumAct / sumEst) * 100) : null;

    // --- Per-tag / per-list completion ---
    const tagRows = TASK_TAGS.map((tag) => {
        const scoped = live.filter((t) => t.tags?.includes(tag.id));
        return { label: tag.label, color: tag.color, done: scoped.filter((t) => t.completed).length, total: scoped.length };
    }).filter((r) => r.total > 0);

    const listRows = lists
        .map((list) => {
            const scoped = live.filter((t) => (t.listId || "default") === list.id);
            return { label: list.name, color: "bg-primary", done: scoped.filter((t) => t.completed).length, total: scoped.length };
        })
        .filter((r) => r.total > 0);

    // --- Upcoming due load: Overdue + next 7 days (LOCAL dates) ---
    const pending = live.filter((t) => !t.completed && !t.archived && t.dueDate);
    const dueCells = [
        { label: "Late", count: pending.filter((t) => t.dueDate! < todayStr).length, overdue: true },
        ...Array.from({ length: 7 }, (_, i) => {
            const d = addDays(new Date(), i);
            return {
                label: i === 0 ? "Today" : format(d, "EEE"),
                count: pending.filter((t) => t.dueDate === format(d, "yyyy-MM-dd")).length,
                overdue: false,
            };
        }),
    ];
    const maxDue = Math.max(...dueCells.map((c) => c.count), 1);

    const Bar = ({ row }: { row: { label: string; color: string; done: number; total: number } }) => (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-24 truncate text-base-content/70">{row.label}</span>
            <div className="flex-1 h-2 bg-base-300/50 rounded-full overflow-hidden">
                <div className={clsx("h-full rounded-full", row.color)} style={{ width: `${(row.done / row.total) * 100}%` }} />
            </div>
            <span className="w-12 text-right font-mono text-xs text-base-content/50">
                {row.done}/{row.total}
            </span>
        </div>
    );

    return (
        <>
            {/* Estimate accuracy */}
            <div className="p-6 bg-base-content/5 rounded-2xl border border-base-content/5">
                <h4 className="text-lg font-bold text-base-content/80 mb-4">Estimate Accuracy</h4>
                {accuracy === null ?
                    <div className="text-sm text-base-content/50 italic">No estimated tasks completed yet.</div>
                :   <>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-xs text-base-content/50 uppercase font-bold">Estimated</div>
                                <div className="text-2xl font-extrabold text-base-content">{sumEst} 🍅</div>
                            </div>
                            <div>
                                <div className="text-xs text-base-content/50 uppercase font-bold">Actual</div>
                                <div className="text-2xl font-extrabold text-base-content">{sumAct} 🍅</div>
                            </div>
                            <div>
                                <div className="text-xs text-base-content/50 uppercase font-bold">Accuracy</div>
                                <div
                                    className={clsx(
                                        "text-2xl font-extrabold",
                                        accuracy <= 120 && accuracy >= 80 ? "text-success" : "text-warning",
                                    )}
                                >
                                    {accuracy}%
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-base-content/40 mt-3">
                            Actual vs. estimated pomodoros on completed tasks. Reflects current data — recurring resets and purged tasks drop out.
                        </p>
                    </>
                }
            </div>

            {/* Per-tag / per-list breakdown */}
            {(tagRows.length > 0 || listRows.length > 0) && (
                <div className="p-6 bg-base-content/5 rounded-2xl border border-base-content/5 space-y-4">
                    <h4 className="text-lg font-bold text-base-content/80">Completion by Tag & List</h4>
                    {tagRows.length > 0 && (
                        <div className="space-y-2">
                            {tagRows.map((row) => (
                                <Bar key={`tag-${row.label}`} row={row} />
                            ))}
                        </div>
                    )}
                    {listRows.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-base-content/5">
                            {listRows.map((row) => (
                                <Bar key={`list-${row.label}`} row={row} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upcoming due load */}
            <div className="p-6 bg-base-content/5 rounded-2xl border border-base-content/5">
                <h4 className="text-lg font-bold text-base-content/80 mb-6">Due Load — Next 7 Days</h4>
                <div className="flex items-end justify-between h-28 gap-2">
                    {dueCells.map((cell, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                            <div className="relative w-full flex items-end justify-center">
                                <div
                                    className={clsx(
                                        "w-full rounded-md transition-all",
                                        cell.overdue ? "bg-error/60 hover:bg-error" : "bg-base-300/50 hover:bg-primary/90",
                                    )}
                                    style={{ height: `${Math.max((cell.count / maxDue) * 96, 4)}px` }}
                                />
                                <div className="absolute -top-7 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {cell.count} due
                                </div>
                            </div>
                            <div className={clsx("text-xs mt-2 font-mono", cell.overdue ? "text-error/70" : "text-base-content/50")}>
                                {cell.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
