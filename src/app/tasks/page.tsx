"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { Archive, ArrowUpDown, Check, ChevronDown, Cloud, EyeOff, Plus, Search, Settings, Trash2, X } from "lucide-react";
import clsx from "clsx";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

import { TODAY_LIST_ID, type FocusHistoryEntry, type ModalType, type NotePage, type PomoSettings, type SavedLink, type SortMode, type TimerMode } from "./constants";
import { usePomodoro } from "./hooks/usePomodoro";
import { useSync } from "./hooks/useSync";
import { useTaskStore } from "./hooks/useTaskStore";
import { downloadBackup, readBackupFile } from "./lib/backup";
import { localToday } from "./lib/dates";
import { migrateLoadedTasks } from "./lib/migrate";
import { calculateStreak } from "./lib/streak";
import { TASK_TAGS, type Task } from "./types";

import BrainstormingModal from "./components/BrainstormingModal";
import DesktopTaskRow, { type RowActions } from "./components/DesktopTaskRow";
import HeaderActions, { type User } from "./components/HeaderActions";
import ListSwitcher from "./components/ListSwitcher";
import { MobileBottomNav, MobileMenuTab, type MobileTab } from "./components/MobileChrome";
import MobileTasksTab from "./components/MobileTasksTab";
import NotesPanel, { MobileNotesTab } from "./components/NotesPanel";
import QuickLinksBar from "./components/QuickLinksBar";
import TaskActionSheet from "./components/TaskActionSheet";
import TaskPopovers, { type PopoverState } from "./components/TaskPopovers";
import TimerCard, { MiniTimer, MobileFocusTab } from "./components/TimerCard";
import Modal from "./components/modals/Modal";
import SettingsModal from "./components/modals/SettingsModal";
import { ArchiveModal, AttachmentModal, NoteModal, ShortcutsModal, SyncModal, TextInputModal } from "./components/modals/SmallModals";
import StatsModal from "./components/modals/StatsModal";

const SORT_MODES: { id: SortMode; label: string }[] = [
    { id: "manual", label: "Manual" },
    { id: "priority", label: "Priority" },
    { id: "due", label: "Due" },
];

// useSearchParams needs a Suspense boundary in Next 16; the inner component
// renders its own skeleton until isLoaded, so a null fallback is fine.
export default function TasksPage() {
    return (
        <Suspense fallback={null}>
            <TasksPageInner />
        </Suspense>
    );
}

function TasksPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- Persisted app state outside the task store ---
    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState<User>(null);
    const [focusHistory, setFocusHistory] = useState<FocusHistoryEntry[]>([]);
    const [notePages, setNotePages] = useState<NotePage[]>([{ id: "default", title: "Notes", content: "" }]);
    const [activeNoteId, setActiveNoteId] = useState("default");
    const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
    // View-only ordering; the underlying array order is untouched so "manual"
    // restores it. Per-device preference (workflow-settings, not synced).
    const [sortMode, setSortMode] = useState<SortMode>("manual");
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    // --- UI state ---
    const [newTaskText, setNewTaskText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [popover, setPopover] = useState<PopoverState>(null);
    const [modal, setModal] = useState<{ type: ModalType; taskId?: string } | null>(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [mobileTab, setMobileTab] = useState<MobileTab>("tasks");
    const [sheetTaskId, setSheetTaskId] = useState<string | null>(null);

    const addTaskInputRef = useRef<HTMLInputElement>(null); // "n" shortcut target
    const searchInputRef = useRef<HTMLInputElement>(null); // "/" shortcut target
    const mobileAddInputRef = useRef<HTMLInputElement>(null); // ?capture=1 focus target on mobile
    const currentTaskIdRef = useRef(currentTaskId);
    currentTaskIdRef.current = currentTaskId;

    const todayStr = localToday();

    // Today's focus-history row, created on demand. Local date keys throughout.
    const bumpToday = useCallback((patch: (entry: FocusHistoryEntry) => FocusHistoryEntry) => {
        const today = localToday();
        setFocusHistory((prev) => {
            const existing = prev.find((h) => h.date === today);
            return existing ? prev.map((h) => (h.date === today ? patch(h) : h)) : [...prev, patch({ date: today, minutes: 0 })];
        });
    }, []);

    const onTaskCompleted = useCallback(
        (task: Task) => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#27272a", "#52525b", "#e4e4e7", "#f4f4f5"],
                disableForReducedMotion: true,
            });
            setCurrentTaskId((prev) => (prev === task.id ? null : prev));
            bumpToday((h) => ({ ...h, tasksCompleted: (h.tasksCompleted || 0) + 1 }));
        },
        [bumpToday],
    );

    const store = useTaskStore({ isLoaded, onTaskCompleted });
    const { tasks, lists, activeListId, actions } = store;

    const timer = usePomodoro({
        onWorkSessionComplete: (minutes) => {
            bumpToday((h) => ({ ...h, minutes: h.minutes + minutes }));
            const focused = currentTaskIdRef.current;
            if (focused) actions.touchTask(focused, (t) => ({ actualPomos: (t.actualPomos || 0) + 1 }));
        },
    });

    const syncSlice = useMemo(
        () => ({ tasks, lists, activeListId, savedLinks, notePages, pomoSettings: timer.settings }),
        [tasks, lists, activeListId, savedLinks, notePages, timer.settings],
    );
    const sync = useSync({
        slice: syncSlice,
        apply: {
            setTasks: store.setTasks,
            setLists: store.setLists,
            setActiveListId: store.setActiveListId,
            setSavedLinks,
            setNotePages,
            setPomoSettings: timer.applySettings,
            applyTimerSettings: (s) => timer.hydrate({ timeLeft: s.timeLeft, mode: s.mode, isTimerMinimized: s.isTimerMinimized }),
        },
        timerSnapshot: () => ({ timeLeft: timer.timeLeft, mode: timer.mode, isTimerMinimized: timer.isMinimized }),
        onAuthLost: (redirect) => {
            setUser(null);
            if (redirect) router.push("/api/auth/discord/login");
        },
    });

    // --- Load / persist ---
    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setUser(data))
            .catch((err) => console.error("Failed to fetch user", err));
    }, []);

    useEffect(() => {
        const read = <T,>(key: string): T | null => {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            try {
                return JSON.parse(raw) as T;
            } catch {
                return null;
            }
        };

        const savedTasks = read<Task[]>("my-tasks");
        store.hydrate({
            tasks: savedTasks ? migrateLoadedTasks(savedTasks) : undefined,
            lists: read("my-task-lists") ?? undefined,
            activeListId: localStorage.getItem("active-list-id") ?? undefined,
        });

        type SavedSettings = Partial<{
            pomoSettings: PomoSettings;
            sessionsCompleted: number;
            timeLeft: number;
            endsAt: number | null;
            mode: TimerMode;
            isTimerMinimized: boolean;
            focusHistory: FocusHistoryEntry[];
            sortMode: SortMode;
        }>;
        const settings = read<SavedSettings>("workflow-settings");
        if (settings) {
            timer.hydrate({
                pomoSettings: settings.pomoSettings,
                sessionsCompleted: settings.sessionsCompleted,
                timeLeft: settings.timeLeft || undefined,
                endsAt: typeof settings.endsAt === "number" ? settings.endsAt : null,
                mode: settings.mode,
                isTimerMinimized: !!settings.isTimerMinimized,
            });
            if (Array.isArray(settings.focusHistory)) setFocusHistory(settings.focusHistory);
            if (settings.sortMode) setSortMode(settings.sortMode);
        }

        const rawNotes = localStorage.getItem("workflow-notes");
        if (rawNotes) {
            try {
                const parsed = JSON.parse(rawNotes);
                // Old single-note format was a bare string
                setNotePages(Array.isArray(parsed) ? parsed : [{ id: "default", title: "Notes", content: String(parsed) }]);
            } catch {
                setNotePages([{ id: "default", title: "Notes", content: rawNotes }]);
            }
        }
        const links = read<SavedLink[]>("workflow-links");
        if (links) setSavedLinks(links);

        setIsLoaded(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot load
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("workflow-notes", JSON.stringify(notePages));
        localStorage.setItem("workflow-links", JSON.stringify(savedLinks));
    }, [notePages, savedLinks, isLoaded]);

    // timer.persisted only changes identity on real timer changes, never per tick
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("workflow-settings", JSON.stringify({ ...timer.persisted, focusHistory, sortMode }));
    }, [timer.persisted, focusHistory, sortMode, isLoaded]);

    // --- Derived views ---
    // "Today" is a virtual cross-list view: overdue + due-today tasks from every
    // list, plus pending undated recurring tasks. Derived only — nothing stored.
    const isTodayTask = useCallback(
        (t: Task) => !t.deletedAt && !t.archived && ((!!t.dueDate && t.dueDate <= todayStr) || (!t.dueDate && !!t.recurrence && !t.completed)),
        [todayStr],
    );
    const currentListTasks = useMemo(
        () => (activeListId === TODAY_LIST_ID ? tasks.filter(isTodayTask) : tasks.filter((t) => !t.deletedAt && (t.listId || "default") === activeListId)),
        [tasks, activeListId, isTodayTask],
    );
    const deletedTasks = useMemo(() => tasks.filter((t) => t.deletedAt), [tasks]);
    const todayCount = useMemo(() => tasks.filter((t) => isTodayTask(t) && !t.completed).length, [tasks, isTodayTask]);
    const listNameById = useMemo(() => new Map(lists.map((l) => [l.id, l.name])), [lists]);
    const archivedTasks = useMemo(() => currentListTasks.filter((t) => t.archived), [currentListTasks]);
    const completedTasks = useMemo(() => currentListTasks.filter((t) => t.completed && !t.archived), [currentListTasks]);

    const displayTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const matches = (t: Task) =>
            !q || t.text.toLowerCase().includes(q) || t.tags?.some((tag) => tag.toLowerCase().includes(q)) || t.notes?.toLowerCase().includes(q);
        const active = currentListTasks.filter((t) => !t.completed && !t.archived && matches(t));

        const rank = { high: 3, medium: 2, low: 1 } as const;
        const byPriority = (a: Task, b: Task) => rank[b.priority ?? "medium"] - rank[a.priority ?? "medium"];
        const byDue = (a: Task, b: Task) => {
            const ad = a.dueDate ?? "9999";
            const bd = b.dueDate ?? "9999";
            return ad < bd ? -1 : ad > bd ? 1 : byPriority(a, b);
        };
        // Today always sorts by due date (manual order is meaningless across lists).
        if (activeListId === TODAY_LIST_ID) return [...active].sort(byDue);
        if (sortMode === "priority") return [...active].sort(byPriority);
        if (sortMode === "due") return [...active].sort(byDue);
        return active;
    }, [currentListTasks, searchQuery, sortMode, activeListId]);
    const reorderDisabled = sortMode !== "manual" || activeListId === TODAY_LIST_ID;

    const currentStreak = useMemo(() => calculateStreak(focusHistory), [focusHistory]);
    const focusedTask = currentTaskId ? tasks.find((t) => t.id === currentTaskId) : undefined;
    const sheetTask = (sheetTaskId && tasks.find((t) => t.id === sheetTaskId && !t.deletedAt)) || null;
    const modalTask = modal?.taskId ? tasks.find((t) => t.id === modal.taskId) : undefined;

    // --- Handlers ---
    const openModal = useCallback((type: ModalType, taskId?: string) => setModal({ type, taskId }), []);
    const closeModal = useCallback(() => setModal(null), []);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        actions.addTask(newTaskText);
        setNewTaskText("");
    };

    const cycleSort = () => {
        const next: SortMode =
            sortMode === "manual" ? "priority"
            : sortMode === "priority" ? "due"
            : "manual";
        setSortMode(next);
        toast.info(`Sort: ${SORT_MODES.find((m) => m.id === next)?.label}`);
    };

    const requireLogin = () => {
        if (user) return true;
        router.push("/api/auth/discord/login");
        return false;
    };

    const exportData = () => {
        downloadBackup({
            tasks,
            lists,
            activeListId,
            savedLinks,
            notePages,
            settings: { timeLeft: timer.timeLeft, mode: timer.mode, isTimerMinimized: timer.isMinimized, pomoSettings: timer.settings },
            focusHistory,
        });
        toast.success("Data exported successfully!");
    };

    const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readBackupFile(file);
            store.hydrate({ tasks: data.tasks ? migrateLoadedTasks(data.tasks) : undefined, lists: data.lists, activeListId: data.activeListId });
            if (data.savedLinks) setSavedLinks(data.savedLinks);
            if (data.notePages) setNotePages(data.notePages);
            if (data.focusHistory) setFocusHistory(data.focusHistory);
            if (data.settings) timer.hydrate(data.settings);
            toast.success("Data imported successfully!");
            closeModal();
        } catch (err) {
            console.error(err);
            toast.error("Failed to import data: Invalid file");
        } finally {
            e.target.value = "";
        }
    };

    // One stable object for the memoized rows
    const rowActions = useMemo<RowActions>(
        () => ({
            toggle: actions.toggleTask,
            rename: actions.renameTask,
            startEdit: (id) => setEditingTaskId(id),
            stopEdit: () => setEditingTaskId(null),
            cyclePriority: actions.cyclePriority,
            cycleRecurrence: actions.cycleRecurrence,
            openPopover: (type, id, anchorEl) => setPopover({ type, taskId: id, anchorEl }),
            toggleFocus: (id) => setCurrentTaskId((prev) => (prev === id ? null : id)),
            remove: actions.deleteTask,
            toggleSubtask: actions.toggleSubtask,
            deleteSubtask: actions.deleteSubtask,
            addSubtask: actions.addSubtask,
            deleteAttachment: actions.deleteAttachment,
            openAttachment: (id) => openModal("ATTACHMENT", id),
        }),
        [actions, openModal],
    );

    // --- Keyboard shortcuts ---
    const toggleTimer = timer.toggle;
    const setActiveListId = store.setActiveListId;
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            // A focused button/link keeps Space for itself (it used to also toggle the timer)
            const el = e.target as HTMLElement | null;
            if (e.key === " " && el && (el.tagName === "BUTTON" || el.tagName === "A" || el.tagName === "SELECT" || el.isContentEditable)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            switch (e.key.toLowerCase()) {
                case " ":
                    e.preventDefault();
                    toggleTimer();
                    break;
                case "n":
                    e.preventDefault();
                    addTaskInputRef.current?.focus();
                    break;
                case "/":
                    e.preventDefault();
                    setNotesOpen(false);
                    searchInputRef.current?.focus();
                    break;
                case "t":
                    setActiveListId(TODAY_LIST_ID);
                    setNotesOpen(false);
                    setMobileTab("tasks");
                    break;
                case "[":
                case "]": {
                    const cycle = [TODAY_LIST_ID, ...lists.map((l) => l.id)];
                    const idx = Math.max(0, cycle.indexOf(activeListId));
                    setActiveListId(cycle[(idx + (e.key === "]" ? 1 : cycle.length - 1)) % cycle.length]);
                    break;
                }
                case "?":
                    openModal("SHORTCUTS");
                    break;
                case "escape":
                    if (modal) closeModal();
                    else if (isZenMode) setIsZenMode(false);
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleTimer, modal, isZenMode, lists, activeListId, openModal, closeModal, setActiveListId]);

    // Quick capture entry points: /tasks?add=<text> (command palette) creates a
    // task through the quick-add parser; /tasks?capture=1 (PWA shortcut) focuses
    // the add input. Must wait for isLoaded — the load effect replaces tasks
    // state, so anything added before it would be lost.
    const consumedAdd = useRef<string | null>(null);
    useEffect(() => {
        if (!isLoaded) return;
        const add = searchParams.get("add");
        const capture = searchParams.get("capture");
        if (!add && !capture) {
            consumedAdd.current = null; // param gone — repeating the same text later works
            return;
        }
        if (add) {
            if (consumedAdd.current === add) return; // strict-mode double-invoke guard
            consumedAdd.current = add;
            actions.addTask(add);
        }
        if (capture) {
            setNotesOpen(false);
            setMobileTab("tasks");
            setTimeout(() => {
                const desktop = window.matchMedia("(min-width: 768px)").matches;
                (desktop ? addTaskInputRef : mobileAddInputRef).current?.focus();
            }, 50);
        }
        router.replace("/tasks", { scroll: false });
    }, [searchParams, isLoaded, actions, router]);

    if (!isLoaded) {
        // Skeleton matching each layout's silhouette so hydration doesn't jump
        return (
            <div className="min-h-dvh w-full p-4 md:p-8 bg-base-100">
                <div className="hidden md:grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="skeleton h-12 w-64" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton h-16 rounded-xl" />
                        ))}
                    </div>
                    <div className="skeleton h-96 rounded-3xl" />
                </div>
                <div className="md:hidden space-y-3 pt-16">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-20 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const mobileTitle =
        mobileTab === "tasks" ? (activeListId === TODAY_LIST_ID ? "Today" : listNameById.get(activeListId) || "My Tasks")
        : mobileTab === "focus" ? "Focus Timer"
        : mobileTab === "notes" ? "Notes"
        : "Menu";

    const syncTone =
        sync.syncStatus === "syncing" ? "text-secondary animate-pulse"
        : sync.syncStatus === "error" ? "text-error"
        : sync.syncStatus === "dirty" ? "text-info"
        : sync.syncKey && user ? "text-success"
        : sync.syncKey && !user ? "text-warning"
        : "text-base-content/50";

    return (
        <div className="min-h-dvh w-full p-4 md:p-8 lg:h-[calc(100dvh-3.5rem-1px)] lg:min-h-0 lg:overflow-hidden bg-gradient-to-br from-base-100 via-base-200 to-base-100 relative">
            {/* Desktop Layout — from lg up this is a viewport-height flex column (3.5rem =
                the sticky site header) so the task panel fills what's left instead of
                overflowing the page and scrolling twice. Below lg the page scrolls normally. */}
            <div className="hidden md:flex md:flex-col md:gap-6 lg:h-full">
                {!isZenMode && (
                    <motion.div layout className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                        <div className="flex items-center gap-6">
                            <ListSwitcher
                                lists={lists}
                                activeListId={activeListId}
                                todayCount={todayCount}
                                onSelect={store.setActiveListId}
                                onDeleteList={actions.deleteList}
                                onCreateList={() => openModal("NEW_LIST")}
                            />
                            <AnimatePresence>{timer.isMinimized && <MiniTimer timer={timer} />}</AnimatePresence>
                        </div>

                        <HeaderActions
                            currentStreak={currentStreak}
                            notificationsEnabled={timer.notificationsEnabled}
                            onRequestNotifications={timer.requestNotificationPermission}
                            sync={{ status: sync.syncStatus, unlocked: !!sync.syncKey, isSyncing: sync.isSyncing, lastSyncTime: sync.lastSyncTime }}
                            user={user}
                            onSyncClick={() => requireLogin() && openModal("SYNC")}
                            archivedCount={archivedTasks.length}
                            onOpen={openModal}
                            onZen={() => setIsZenMode(true)}
                        />
                    </motion.div>
                )}

                {isZenMode && (
                    <div className="fixed top-6 right-6 z-50">
                        <button
                            onClick={() => setIsZenMode(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-base-200/80 backdrop-blur border border-base-content/5 rounded-full text-base-content/50 hover:text-base-content hover:bg-base-300/70 transition-all text-sm font-medium"
                        >
                            <EyeOff size={16} />
                            Exit Zen
                        </button>
                    </div>
                )}

                {!isZenMode && (
                    <QuickLinksBar
                        links={savedLinks}
                        onAdd={(link) => setSavedLinks((prev) => [...prev, link])}
                        onRemove={(id) => setSavedLinks((prev) => prev.filter((l) => l.id !== id))}
                        notesOpen={notesOpen}
                        onToggleNotes={() => setNotesOpen(!notesOpen)}
                    />
                )}

                <NotesPanel open={notesOpen} onClose={() => setNotesOpen(false)} pages={notePages} onChange={setNotePages} activeId={activeNoteId} onSelect={setActiveNoteId} />

                <div className={clsx("grid gap-8 lg:flex-1 lg:min-h-0", isZenMode ? "grid-cols-1 w-full max-w-5xl mx-auto" : "lg:grid-cols-3")}>
                    <AnimatePresence>
                        {!timer.isMinimized && !isZenMode && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="lg:col-span-1 space-y-6 overflow-hidden lg:min-h-0 lg:overflow-y-auto custom-scrollbar"
                            >
                                <TimerCard timer={timer} focusedTaskText={focusedTask?.text} onOpenSettings={() => openModal("SETTINGS")} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        layout
                        className={clsx(
                            "transition-all duration-500 lg:min-h-0 lg:h-full",
                            isZenMode ? "col-span-1"
                            : timer.isMinimized ? "lg:col-span-3"
                            : "lg:col-span-2",
                        )}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" as const }}
                            className="rounded-3xl bg-base-200/50 border border-base-content/5 p-4 md:p-6 h-[calc(100vh-6rem)] lg:h-full shadow-xl flex flex-col overflow-hidden"
                        >
                            <div className="flex-shrink-0">
                                <form onSubmit={handleAddTask} className="relative mb-5 group">
                                    <input
                                        ref={addTaskInputRef}
                                        type="text"
                                        placeholder="What's your focus today?"
                                        title="Quick add: #tag !priority @due — e.g. 'Ship blog post #work !high @fri'"
                                        className="w-full bg-transparent text-xl md:text-2xl font-medium text-base-content placeholder:text-base-content/50 border-b-2 border-base-content/5 py-3 focus:outline-none focus:border-primary transition-colors pl-2"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity btn btn-circle btn-sm btn-ghost text-base-content"
                                        aria-label="Add task"
                                    >
                                        <Plus size={24} />
                                    </button>
                                    {/* Quick-add syntax hint — shown only while typing so it adds no height at rest */}
                                    <div className="absolute left-2 -bottom-5 text-[11px] text-base-content/40 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                                        #tag &nbsp;·&nbsp; !high / !low &nbsp;·&nbsp; @today, @fri, @{todayStr}
                                    </div>
                                </form>

                                <div className="flex items-center gap-3 mb-3 px-1">
                                    <h2 className="text-lg font-bold text-base-content shrink-0">
                                        Active Tasks
                                        <span className="ml-2 text-sm font-medium text-base-content/40 tabular-nums">{displayTasks.length}</span>
                                    </h2>
                                    <div className="relative flex-1 max-w-56 ml-auto">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search…"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-base-content/5 text-base-content/80 pl-8 pr-7 py-1.5 rounded-lg border border-transparent focus:outline-none focus:border-base-content/30 focus:bg-base-content/10 text-xs transition-colors"
                                            aria-label="Search tasks"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content/80"
                                                aria-label="Clear search"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    {/* Sort control — hidden in Today (always due-date ordered there) */}
                                    {activeListId !== TODAY_LIST_ID && (
                                        <div className="flex items-center gap-1 bg-base-content/5 rounded-lg p-1 shrink-0" title="Sort tasks">
                                            <ArrowUpDown size={14} className="text-base-content/40 ml-1.5 mr-0.5" />
                                            {SORT_MODES.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSortMode(m.id)}
                                                    className={clsx(
                                                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                                        sortMode === m.id ? "bg-base-300 text-base-content shadow-sm" : "text-base-content/50 hover:text-base-content/80",
                                                    )}
                                                    aria-pressed={sortMode === m.id}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-visible px-3 py-2 custom-scrollbar min-h-0">
                                <Reorder.Group axis="y" values={displayTasks} onReorder={reorderDisabled ? () => {} : actions.reorder} className="space-y-3 pb-2">
                                    <AnimatePresence initial={false}>
                                        {displayTasks.map((task) => (
                                            <DesktopTaskRow
                                                key={task.id}
                                                task={task}
                                                listName={activeListId === TODAY_LIST_ID ? (listNameById.get(task.listId || "default") ?? "My Tasks") : undefined}
                                                todayStr={todayStr}
                                                reorderDisabled={reorderDisabled}
                                                isFocused={currentTaskId === task.id}
                                                isEditing={editingTaskId === task.id}
                                                isMenuOpen={popover?.type === "more" && popover.taskId === task.id}
                                                actions={rowActions}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>

                                {displayTasks.length === 0 && (
                                    <div className="py-14 text-center text-sm text-base-content/40">
                                        {searchQuery.trim() ? "No tasks match your search"
                                        : activeListId === TODAY_LIST_ID ? "Nothing due today 🎉"
                                        : "No active tasks — add one above"}
                                    </div>
                                )}

                                {/* Completed — inside the scroll region so a long list can't squeeze the active tasks out */}
                                {completedTasks.length > 0 && (
                                    <div className="transition-opacity pt-2">
                                        <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 mb-4 px-2 w-full group" aria-expanded={showCompleted}>
                                            <ChevronDown size={16} className={clsx("text-base-content/50 transition-transform", !showCompleted && "-rotate-90")} />
                                            <h2 className="text-sm font-bold text-base-content/50 uppercase tracking-wider group-hover:text-base-content/80 transition-colors">
                                                Completed ({completedTasks.length})
                                            </h2>
                                            <div className="h-px flex-1 bg-base-content/5 ml-2" />
                                        </button>

                                        <AnimatePresence>
                                            {showCompleted && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="space-y-3 overflow-hidden"
                                                >
                                                    {completedTasks.map((task) => (
                                                        <motion.div
                                                            key={task.id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="relative flex items-center gap-4 p-4 rounded-xl border border-transparent bg-base-300/40"
                                                        >
                                                            <div className="w-[18px]" />
                                                            <button
                                                                onClick={() => actions.toggleTask(task.id)}
                                                                className="w-6 h-6 rounded-full border-2 bg-base-content/50 border-base-content/40 flex items-center justify-center transition-colors flex-shrink-0"
                                                                aria-label="Mark incomplete"
                                                            >
                                                                <Check size={14} className="text-base-100" />
                                                            </button>
                                                            <span className="flex-1 text-lg font-medium select-none truncate line-through text-base-content/50">{task.text}</span>
                                                            <button
                                                                onClick={() => actions.archiveTask(task.id)}
                                                                className="p-2 text-base-content/50 hover:text-base-content/80 transition-colors"
                                                                title="Archive"
                                                            >
                                                                <Archive size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => actions.deleteTask(task.id)}
                                                                className="p-2 text-base-content/30 hover:text-error transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Layout — the site nav is hidden on this route at mobile widths (see layout.tsx) */}
            <div className="md:hidden fixed inset-0 z-40 bg-base-100 flex flex-col h-[100dvh] supports-[height:100svh]:h-[100svh] overflow-hidden">
                <div className="px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between shrink-0">
                    <h1 className="text-2xl font-bold text-base-content">{mobileTitle}</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => requireLogin() && openModal("SYNC")} className={clsx("btn btn-ghost btn-circle btn-sm", syncTone)} aria-label="Sync status">
                            <Cloud size={20} />
                        </button>
                        <button onClick={() => openModal("SETTINGS")} className="btn btn-ghost btn-circle btn-sm" aria-label="Settings">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {mobileTab === "tasks" && (
                        <MobileTasksTab
                            lists={lists}
                            activeListId={activeListId}
                            onSelectList={store.setActiveListId}
                            onCreateList={() => openModal("NEW_LIST")}
                            todayCount={todayCount}
                            sortMode={sortMode}
                            onCycleSort={cycleSort}
                            searchQuery={searchQuery}
                            onSearch={setSearchQuery}
                            newTaskText={newTaskText}
                            onNewTaskText={setNewTaskText}
                            onSubmit={handleAddTask}
                            addInputRef={mobileAddInputRef}
                            displayTasks={displayTasks}
                            completedTasks={completedTasks}
                            listNameById={listNameById}
                            currentTaskId={currentTaskId}
                            showCompleted={showCompleted}
                            onToggleCompleted={() => setShowCompleted(!showCompleted)}
                            actions={actions}
                            onOpenSheet={setSheetTaskId}
                        />
                    )}
                    {mobileTab === "focus" && <MobileFocusTab timer={timer} />}
                    {mobileTab === "notes" && <MobileNotesTab pages={notePages} onChange={setNotePages} activeId={activeNoteId} onSelect={setActiveNoteId} />}
                    {mobileTab === "menu" && (
                        <MobileMenuTab
                            onOpen={openModal}
                            onSync={() => {
                                if (!requireLogin()) return;
                                if (sync.syncKey) {
                                    sync.pullNow(false, true);
                                    toast.info("Checking for updates...");
                                }
                                openModal("SYNC");
                            }}
                        />
                    )}
                </div>

                <MobileBottomNav tab={mobileTab} onChange={setMobileTab} />
            </div>

            <TaskPopovers
                popover={popover}
                tasks={tasks}
                lists={lists}
                actions={actions}
                onClose={() => setPopover(null)}
                onSwitch={(type) => setPopover((p) => (p ? { ...p, type } : p))}
                onRename={(id) => setEditingTaskId(id)}
                onOpenModal={openModal}
            />

            <TaskActionSheet
                task={sheetTask}
                lists={lists}
                tags={TASK_TAGS}
                canReorder={!reorderDisabled}
                isFocused={sheetTask ? currentTaskId === sheetTask.id : false}
                onClose={() => setSheetTaskId(null)}
                onUpdate={(patch) => sheetTask && actions.touchTask(sheetTask.id, patch)}
                onToggleTag={(tagId) => sheetTask && actions.toggleTag(sheetTask.id, tagId)}
                onDelete={() => {
                    if (!sheetTask) return;
                    actions.deleteTask(sheetTask.id);
                    setSheetTaskId(null);
                }}
                onArchive={() => {
                    if (!sheetTask) return;
                    actions.archiveTask(sheetTask.id);
                    setSheetTaskId(null);
                }}
                onToggleFocus={() => sheetTask && setCurrentTaskId(currentTaskId === sheetTask.id ? null : sheetTask.id)}
                onMove={(dir) => sheetTask && actions.moveTask(sheetTask.id, dir)}
                onOpenNotes={() => {
                    if (!sheetTask) return;
                    setSheetTaskId(null);
                    openModal("NOTE", sheetTask.id);
                }}
                onOpenAttachment={() => {
                    if (!sheetTask) return;
                    setSheetTaskId(null);
                    openModal("ATTACHMENT", sheetTask.id);
                }}
                onOpenSubtask={() => {
                    if (!sheetTask) return;
                    setSheetTaskId(null);
                    openModal("SUBTASK", sheetTask.id);
                }}
            />

            <Modal type={modal?.type ?? null} onClose={closeModal}>
                {modal?.type === "SUBTASK" && modal.taskId && (
                    <TextInputModal
                        placeholder="What needs to be done?"
                        submitLabel="Add Subtask"
                        onSubmit={(text) => {
                            actions.addSubtask(modal.taskId!, text);
                            closeModal();
                        }}
                        onCancel={closeModal}
                    />
                )}
                {modal?.type === "NEW_LIST" && (
                    <TextInputModal
                        placeholder="e.g., Work, Personal, Side Project..."
                        submitLabel="Create List"
                        onSubmit={(name) => {
                            actions.createList(name);
                            closeModal();
                        }}
                        onCancel={closeModal}
                    />
                )}
                {modal?.type === "ATTACHMENT" && modal.taskId && (
                    <AttachmentModal
                        onSubmit={(url, name) => {
                            actions.addAttachment(modal.taskId!, url, name);
                            closeModal();
                        }}
                        onCancel={closeModal}
                    />
                )}
                {modal?.type === "NOTE" && modal.taskId && (
                    <NoteModal
                        key={modal.taskId}
                        initial={modalTask?.notes ?? ""}
                        onSave={(text) => {
                            actions.setNotes(modal.taskId!, text);
                            closeModal();
                        }}
                        onCancel={closeModal}
                    />
                )}
                {modal?.type === "BRAINSTORM" && <BrainstormingModal onAddTask={(text, subtasks) => actions.addTask(text, subtasks)} onClose={closeModal} />}
                {modal?.type === "SYNC" && (
                    <SyncModal
                        isSyncing={sync.isSyncing}
                        onSubmit={async (password) => {
                            if (await sync.setupSync(password)) closeModal();
                        }}
                        onCancel={closeModal}
                    />
                )}
                {modal?.type === "SETTINGS" && (
                    <SettingsModal
                        settings={timer.settings}
                        onSave={(next) => {
                            timer.applySettings(next);
                            toast.info("Settings Saved");
                            closeModal();
                        }}
                        onCancel={closeModal}
                        sync={{
                            unlocked: !!sync.syncKey,
                            hasSalt: !!sync.syncSalt,
                            lastSyncTime: sync.lastSyncTime,
                            isSyncing: sync.isSyncing,
                            onOpen: () => openModal("SYNC"),
                            onPullNow: () => sync.pullNow(),
                        }}
                        onExport={exportData}
                        onImport={importData}
                    />
                )}
                {modal?.type === "SHORTCUTS" && <ShortcutsModal />}
                {modal?.type === "ARCHIVE" && (
                    <ArchiveModal
                        archivedTasks={archivedTasks}
                        deletedTasks={deletedTasks}
                        onUnarchive={actions.unarchiveTask}
                        onDelete={actions.deleteTask}
                        onRestore={actions.restoreTask}
                    />
                )}
                {modal?.type === "STATS" && (
                    <StatsModal
                        tasks={tasks}
                        lists={lists}
                        completedTasks={completedTasks}
                        focusHistory={focusHistory}
                        sessionsCompleted={timer.sessionsCompleted}
                        currentStreak={currentStreak}
                        todayStr={todayStr}
                    />
                )}
            </Modal>
        </div>
    );
}
