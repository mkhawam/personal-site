"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
    Play,
    Pause,
    RotateCcw,
    Plus,
    Trash2,
    Check,
    BrainCircuit,
    Sparkles,
    GripVertical,
    Bell,
    CornerDownRight,
    FileText,
    X,
    Maximize2,
    Minimize2,
    Settings,
    Archive,
    RotateCw,
    Flag,
    Paperclip,
    ExternalLink,
    Globe,
    Image as ImageIcon,
    Video,
    FileCode,
    Download,
    Upload,
    Eye,
    EyeOff,
    Keyboard,
    BarChart,
    ChevronDown,
    FolderPlus,
    Target,
    Calendar,
    Flame,
    Repeat,
    Headphones,
    Volume2,
    VolumeX,
    Move,
    Search,
    Sun,
    ArrowUpDown,
    Tag,
    Lock,
    Cloud,
    RefreshCw,
    Home,
    Clock,
    Menu,
    BarChart3,
    FolderInput,
} from "lucide-react";
// Brand icons — lucide-react 1.x dropped brand glyphs; react-icons (already a
// dependency, used in Socials) is lucide's recommended source for these.
import {
    FaGithub,
    FaYoutube,
    FaTwitter,
    FaFigma,
    FaInstagram,
    FaLinkedin,
    FaCodepen,
    FaTrello,
    FaSlack,
} from "react-icons/fa";
import { toast } from "sonner";
import { addDays, addWeeks, format, formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import { deriveKey, encryptData, decryptData, exportKey, importJWK } from "@/lib/client-crypto";
import { useRouter, useSearchParams } from "next/navigation";
import { generateSummary } from "@/lib/ai";
import BrainstormingModal from "./components/BrainstormingModal";
import SpotifyWidget from "./components/SpotifyWidget";
import TaskTagsMenu from "./components/TaskTagsMenu";
import TaskActionSheet from "./components/TaskActionSheet";
import MobileTaskCard from "./components/MobileTaskCard";
import NoteEditor from "./components/NoteEditor";
import StatsExtras from "./components/StatsExtras";
import AnchorPopover from "./components/AnchorPopover";
import { localToday, nextOccurrence } from "./lib/dates";
import { mergeLists, mergeTasks } from "./lib/merge";
import { parseQuickAdd } from "./lib/quickAdd";
import { TASK_TAGS, type Task, type TaskList } from "./types";

type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

// Virtual cross-list "Today" view id — can't collide with real list ids
// (those are Date.now().toString(36)).
const TODAY_LIST_ID = "__today__";

const SOUNDS = {
    bell: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    digital: "https://assets.mixkit.co/active_storage/sfx/2864/2864-preview.mp3",
    nature: "https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3",
};

const RADIO_STATIONS = [
    { name: "Lo-fi Hip Hop", url: "https://streams.ilovemusic.de/iloveradio17.mp3", color: "bg-purple-500" },
    { name: "Chillhop", url: "https://streams.ilovemusic.de/iloveradio2.mp3", color: "bg-blue-500" },
    { name: "Jazz Vibes", url: "https://streams.ilovemusic.de/iloveradio10.mp3", color: "bg-amber-500" },
    { name: "Deep Focus", url: "https://streams.ilovemusic.de/iloveradio16.mp3", color: "bg-green-500" },
];

const DEFAULT_SETTINGS = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    interval: 4,
    sound: "bell" as keyof typeof SOUNDS,
};

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
    // --- State ---
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lists, setLists] = useState<TaskList[]>([{ id: "default", name: "My Tasks" }]);
    const [activeListId, setActiveListId] = useState<string>("default");
    const [newTaskText, setNewTaskText] = useState("");

    // Tag picker UI (portal-based to avoid clipping inside scroll containers)
    const [openTagMenuTaskId, setOpenTagMenuTaskId] = useState<string | null>(null);
    const [tagMenuAnchorEl, setTagMenuAnchorEl] = useState<HTMLElement | null>(null);

    // Lightweight anchored editors for desktop task rows (due date / move / estimate)
    const [popover, setPopover] = useState<{ type: "due" | "move" | "estimate"; taskId: string; anchorEl: HTMLElement } | null>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTaskID, setActiveTaskID] = useState<string | null>(null);

    const [modalType, setModalType] = useState<
        | "SUBTASK"
        | "NOTE"
        | "BRAINSTORM"
        | "SETTINGS"
        | "ARCHIVE"
        | "ATTACHMENT"
        | "SHORTCUTS"
        | "STATS"
        | "NEW_LIST"
        | "SYNC"
    >("SUBTASK");
    const [modalInput, setModalInput] = useState("");
    const [attachmentName, setAttachmentName] = useState(""); // Separate state for attachment name

    // Brainstorm Context State
    const [contextFile, setContextFile] = useState<{ name: string; content: string } | null>(null);
    const [contextUrl, setContextUrl] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);

    // AI Brainstorm State (Chat Mode)
    const [chatMessages, setChatMessages] = useState<(ChatMessage & { tasks?: { id: string; text: string; selected: boolean }[] })[]>([]);
    const [isChatTyping, setIsChatTyping] = useState(false);

    // Sync State
    const [syncKey, setSyncKey] = useState<CryptoKey | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [syncSalt, setSyncSalt] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<"disabled" | "synced" | "syncing" | "dirty" | "error">("disabled");

    // User State
    const [user, setUser] = useState<{ username: string; avatar: string | null } | null>(null);

    // Mobile State
    const [mobileTab, setMobileTab] = useState<"tasks" | "focus" | "notes" | "menu">("tasks");
    const [sheetTaskId, setSheetTaskId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) setUser(data);
            })
            .catch((err) => console.error("Failed to fetch user", err));
    }, []);

    // Load persistent sync state on mount
    useEffect(() => {
        const savedSalt = localStorage.getItem("workflow-sync-salt");
        if (savedSalt) setSyncSalt(savedSalt);

        const savedKeyJWK = localStorage.getItem("workflow-sync-key");
        if (savedKeyJWK) {
            try {
                const jwk = JSON.parse(savedKeyJWK);
                importJWK(jwk)
                    .then((key) => {
                        setSyncKey(key);
                        toast.success("Sync unlocked automatically");
                    })
                    .catch((e) => console.error("Failed to import key", e));
            } catch (e) {
                console.error("Invalid JWK in storage");
            }
        }
    }, []);

    // Pomodoro
    const [pomoSettings, setPomoSettings] = useState(DEFAULT_SETTINGS);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.work * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<"work" | "break" | "longBreak">("work");
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isTimerMinimized, setIsTimerMinimized] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [focusHistory, setFocusHistory] = useState<{ date: string; minutes: number; tasksCompleted?: number }[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Settings Form State
    const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
    const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [showMusicPanel, setShowMusicPanel] = useState(false);
    const [currentStation, setCurrentStation] = useState(0);
    const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
    const [customStreamUrl, setCustomStreamUrl] = useState("");
    const [streamType, setStreamType] = useState<"youtube" | "twitch">("youtube");
    const [musicMode, setMusicMode] = useState<"radio" | "spotify" | "video">("spotify");

    // AI State
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState("");

    // Notes & Links Module State
    const [activeTab, setActiveTab] = useState<"tasks" | "notes" | "links">("tasks");
    const [notePages, setNotePages] = useState<{ id: string; title: string; content: string }[]>([{ id: "default", title: "Notes", content: "" }]);
    const [activeNoteId, setActiveNoteId] = useState("default");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    const [savedLinks, setSavedLinks] = useState<{ id: string; title: string; url: string; createdAt: string }[]>([]);
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    // View-only ordering; underlying array order is untouched so "manual" restores it.
    // Per-device preference (workflow-settings localStorage, not synced).
    const [sortMode, setSortMode] = useState<"manual" | "priority" | "due">("manual");
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const musicRef = useRef<HTMLAudioElement | null>(null);
    const modalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const addTaskInputRef = useRef<HTMLInputElement>(null); // "n" shortcut target — never find inputs by placeholder text
    const searchInputRef = useRef<HTMLInputElement>(null); // "/" shortcut target (desktop search)
    const mobileAddInputRef = useRef<HTMLInputElement>(null); // ?capture=1 focus target on mobile

    // --- Effects ---

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            // ... (existing notification logic)
            if (Notification.permission === "granted") {
                setNotificationsEnabled(true);
            }
        }
        audioRef.current = new Audio(SOUNDS[pomoSettings.sound] || SOUNDS.bell);
    }, [pomoSettings.sound]);

    useEffect(() => {
        // Auto focus logic
        if (modalOpen && modalInputRef.current && !["SETTINGS", "ARCHIVE"].includes(modalType)) {
            setTimeout(() => modalInputRef.current?.focus(), 100);
        }
    }, [modalOpen, modalType]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        let modeLabel = "Focus";
        if (mode === "break") modeLabel = "Short Break";
        if (mode === "longBreak") modeLabel = "Long Break";

        document.title = isRunning ? `(${timeString}) ${modeLabel}` : "Workflow";

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
            audioRef.current?.play().catch((e) => console.log("Audio play failed", e));

            if (mode === "work") {
                const newSessions = sessionsCompleted + 1;
                setSessionsCompleted(newSessions);

                // Increment pomos on current task
                if (currentTaskId) {
                    setTasks((prev) =>
                        prev.map((t) =>
                            t.id === currentTaskId ?
                                { ...t, actualPomos: (t.actualPomos || 0) + 1, updatedAt: new Date().toISOString() }
                            :   t,
                        ),
                    );
                }

                // Log History
                const today = new Date().toISOString().split("T")[0];
                setFocusHistory((prev) => {
                    const existing = prev.find((h) => h.date === today);
                    if (existing) {
                        return prev.map((h) => (h.date === today ? { ...h, minutes: h.minutes + pomoSettings.work } : h));
                    }
                    return [...prev, { date: today, minutes: pomoSettings.work }];
                });

                if (newSessions % pomoSettings.interval === 0) {
                    setMode("longBreak");
                    setTimeLeft(pomoSettings.longBreak * 60);
                    toast.success(`Great job! You've done ${newSessions} sessions.`, {
                        description: `Take a ${pomoSettings.longBreak}m long break.`,
                    });
                    if (notificationsEnabled)
                        new Notification("Long Break!", { body: `Great job! You've done ${newSessions} sessions. Take ${pomoSettings.longBreak}m.` });
                } else {
                    setMode("break");
                    setTimeLeft(pomoSettings.shortBreak * 60);
                    toast.success("Focus Session Complete!", { description: "Time to recharge." });
                    if (notificationsEnabled) new Notification("Short Break!", { body: "Time to recharge." });
                }
            } else {
                setMode("work");
                setTimeLeft(pomoSettings.work * 60);
                toast.info("Break Over!", { description: "Ready to focus?" });
                if (notificationsEnabled) new Notification("Back to Work!", { body: "Ready to focus?" });
            }
        }

        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode, notificationsEnabled, sessionsCompleted, pomoSettings]);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem("my-tasks");
        if (saved) {
            const loadedTasks = JSON.parse(saved);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Tombstones older than 30 days have propagated to any other device by now
            const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

            // Migration and recurring task reset
            const migratedTasks = loadedTasks
                .filter((t: Task) => !t.deletedAt || Date.now() - new Date(t.deletedAt).getTime() < TOMBSTONE_TTL_MS)
                .map((t: Task) => {
                    let task = {
                        ...t,
                        listId: t.listId || "default",
                    };

                    // Reset recurring tasks if needed
                    if (task.recurrence && task.completed && task.lastCompletedDate) {
                        const lastCompleted = new Date(task.lastCompletedDate + "T00:00:00");
                        const daysSince = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

                        let shouldReset = false;
                        if (task.dueDate) {
                            // dueDate advanced to the next occurrence at completion,
                            // so "due date arrived" IS the next-period trigger — and
                            // it handles monthly correctly (calendar month, not 30d).
                            shouldReset = task.dueDate <= localToday();
                        } else {
                            if (task.recurrence === "daily" && daysSince >= 1) shouldReset = true;
                            if (task.recurrence === "weekly" && daysSince >= 7) shouldReset = true;
                            if (task.recurrence === "monthly" && daysSince >= 30) shouldReset = true;
                        }

                        if (shouldReset) {
                            // Real data change — stamp it so the reset wins the sync merge.
                            // The plain migration path above must NOT stamp, or every load
                            // would look like a local edit.
                            task = { ...task, completed: false, actualPomos: 0, updatedAt: new Date().toISOString() };
                        }
                    }

                    return task;
                });
            setTasks(migratedTasks);
        }

        const savedLists = localStorage.getItem("my-task-lists");
        if (savedLists) {
            setLists(JSON.parse(savedLists));
        }

        const savedActiveList = localStorage.getItem("active-list-id");
        if (savedActiveList) {
            setActiveListId(savedActiveList);
        }

        const savedSettings = localStorage.getItem("workflow-settings");
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.pomoSettings) setPomoSettings(parsed.pomoSettings);
            if (parsed.sessionsCompleted !== undefined) setSessionsCompleted(parsed.sessionsCompleted);
            if (parsed.focusHistory) setFocusHistory(parsed.focusHistory);

            setTimeLeft(parsed.timeLeft || DEFAULT_SETTINGS.work * 60);
            setMode(parsed.mode || "work");
            setIsTimerMinimized(parsed.isTimerMinimized || false);
            if (parsed.sortMode) setSortMode(parsed.sortMode);
        }

        // Load Notes & Links
        const savedNotes = localStorage.getItem("workflow-notes");
        if (savedNotes) {
            try {
                const parsed = JSON.parse(savedNotes);
                if (Array.isArray(parsed)) {
                    setNotePages(parsed);
                } else {
                    // Migration from old single-note format
                    setNotePages([{ id: "default", title: "Notes", content: parsed }]);
                }
            } catch {
                // Old string format - migrate
                setNotePages([{ id: "default", title: "Notes", content: savedNotes }]);
            }
        }

        const savedLinksData = localStorage.getItem("workflow-links");
        if (savedLinksData) setSavedLinks(JSON.parse(savedLinksData));

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("my-tasks", JSON.stringify(tasks));
            localStorage.setItem("my-task-lists", JSON.stringify(lists));
            localStorage.setItem("active-list-id", activeListId);
        }
    }, [tasks, lists, activeListId, isLoaded]);

    // Save Notes & Links
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("workflow-notes", JSON.stringify(notePages));
            localStorage.setItem("workflow-links", JSON.stringify(savedLinks));
        }
    }, [notePages, savedLinks, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(
                "workflow-settings",
                JSON.stringify({
                    timeLeft,
                    mode,
                    isTimerMinimized,
                    pomoSettings,
                    sessionsCompleted,
                    focusHistory,
                    sortMode,
                }),
            );
        }
    }, [timeLeft, mode, isTimerMinimized, pomoSettings, sessionsCompleted, focusHistory, sortMode, isLoaded]);

    // --- Handlers ---
    const requestNotificationPermission = async () => {
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
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        if (mode === "work") setTimeLeft(pomoSettings.work * 60);
        else if (mode === "break") setTimeLeft(pomoSettings.shortBreak * 60);
        else if (mode === "longBreak") setTimeLeft(pomoSettings.longBreak * 60);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

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
                    setActiveTab("tasks");
                    searchInputRef.current?.focus();
                    break;
                case "t":
                    setActiveListId(TODAY_LIST_ID);
                    setActiveTab("tasks");
                    setMobileTab("tasks");
                    break;
                case "[":
                case "]": {
                    const cycle = [TODAY_LIST_ID, ...lists.map((l) => l.id)];
                    const idx = Math.max(0, cycle.indexOf(activeListId));
                    const next = cycle[(idx + (e.key === "]" ? 1 : cycle.length - 1)) % cycle.length];
                    setActiveListId(next);
                    break;
                }
                case "?":
                    openModal(null, "SHORTCUTS");
                    break;
                case "escape":
                    if (modalOpen) setModalOpen(false);
                    else if (isZenMode) setIsZenMode(false);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleTimer, modalOpen, isZenMode, lists, activeListId]);

    const switchMode = (m: "work" | "break" | "longBreak") => {
        setMode(m);
        setIsRunning(false);
        if (m === "work") setTimeLeft(pomoSettings.work * 60);
        else if (m === "break") setTimeLeft(pomoSettings.shortBreak * 60);
        else if (m === "longBreak") setTimeLeft(pomoSettings.longBreak * 60);
    };

    const addTask = (text: string, initialSubtasks: string[] = []) => {
        if (!text.trim()) return;
        // Quick-add syntax: "#tag !high @tomorrow" tokens become task fields
        const parsed = parseQuickAdd(text, TASK_TAGS);
        if (!parsed.text) return;
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const subtasksObjs = initialSubtasks.map((t) => ({
            id: Math.random().toString(36),
            text: t,
            completed: false,
        }));

        // Adding "to Today" means due today, filed in the default list
        const inToday = activeListId === TODAY_LIST_ID;
        setTasks((prev) => [
            {
                id,
                text: parsed.text,
                completed: false,
                subtasks: subtasksObjs,
                priority: parsed.priority || "medium",
                tags: parsed.tags,
                dueDate: parsed.dueDate || (inToday ? localToday() : undefined),
                attachments: [],
                listId: inToday ? "default" : activeListId, // Tag with active list
                updatedAt: new Date().toISOString(),
            },
            ...prev,
        ]);
        toast.success("Task Added");
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        addTask(newTaskText);
        setNewTaskText("");
    };

    // Single mutation path for task edits: functional update (no stale closures)
    // + updatedAt stamp so the sync merge can do per-task last-write-wins.
    const touchTask = (id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id ?
                    { ...t, ...(typeof patch === "function" ? patch(t) : patch), updatedAt: new Date().toISOString() }
                :   t,
            ),
        );
    };

    const toggleTask = (id: string) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const isCompleting = !task.completed;

        if (isCompleting) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#27272a", "#52525b", "#e4e4e7", "#f4f4f5"],
                disableForReducedMotion: true,
            });

            // Clear focus if this was the current task
            if (currentTaskId === id) {
                setCurrentTaskId(null);
            }

            // Log Task Completion
            const today = new Date().toISOString().split("T")[0];
            setFocusHistory((prev) => {
                const existing = prev.find((h) => h.date === today);
                if (existing) {
                    return prev.map((h) => (h.date === today ? { ...h, tasksCompleted: (h.tasksCompleted || 0) + 1 } : h));
                }
                return [...prev, { date: today, minutes: 0, tasksCompleted: 1 }];
            });
        }

        // Track lastCompletedDate for recurring tasks. LOCAL date — the load-time
        // reset parses this as local, so a UTC stamp is off by one in the evening.
        const today = localToday();
        touchTask(id, (t) => ({
            completed: !t.completed,
            lastCompletedDate: isCompleting ? today : t.lastCompletedDate,
            // Completing a recurring task rolls its due date to the next future
            // occurrence (it leaves Today immediately). Un-completing does not
            // rewind; the same-day guard stops a toggle-off/on double advance.
            ...(isCompleting && t.recurrence && t.dueDate && t.lastCompletedDate !== today ?
                { dueDate: nextOccurrence(t.dueDate, t.recurrence, today) }
            :   {}),
        }));
    };

    const cyclePriority = (id: string) => {
        touchTask(id, (t) => {
            const current = t.priority || "medium";
            let next: "low" | "medium" | "high" = "medium";
            if (current === "low") next = "medium";
            if (current === "medium") next = "high";
            if (current === "high") next = "low";
            return { priority: next };
        });
    };

    const cycleRecurrence = (id: string) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const order: (typeof task.recurrence)[] = [null, "daily", "weekly", "monthly"];
        const next = order[(order.indexOf(task.recurrence || null) + 1) % order.length];
        toast.info(`Recurrence: ${next ? next : "none"}`);
        touchTask(id, { recurrence: next });
    };

    const toggleTag = (taskId: string, tagId: string) => {
        touchTask(taskId, (t) => {
            const currentTags = t.tags || [];
            return {
                tags: currentTags.includes(tagId) ? currentTags.filter((tag) => tag !== tagId) : [...currentTags, tagId],
            };
        });
    };

    const [searchQuery, setSearchQuery] = useState("");

    const restoreTask = (id: string) => {
        // Fresh updatedAt so the restore beats an already-synced tombstone.
        touchTask(id, { deletedAt: undefined });
    };

    // Soft delete: tombstone instead of removing, so sync propagates the delete
    // instead of resurrecting the task, and Undo is always possible.
    const deleteTask = (id: string) => {
        touchTask(id, { deletedAt: new Date().toISOString() });
        toast("Task Deleted", {
            action: {
                label: "Undo",
                onClick: () => restoreTask(id),
            },
        });
    };

    const deleteList = (id: string) => {
        if (id === "default") return;

        // confirm?
        if (!confirm("Are you sure? All tasks in this list will be deleted.")) return;

        setLists((prev) => prev.filter((l) => l.id !== id));
        // Tombstone the list's tasks (a hard filter would let sync resurrect them)
        const now = new Date().toISOString();
        setTasks((prev) => prev.map((t) => (t.listId === id ? { ...t, deletedAt: now, updatedAt: now } : t)));

        if (activeListId === id) {
            setActiveListId("default");
        }
        toast.success("List Deleted");
    };

    const archiveTask = (id: string) => {
        touchTask(id, { archived: true });
        toast("Task Archived", {
            action: {
                label: "Undo",
                onClick: () => unarchiveTask(id),
            },
        });
    };

    const unarchiveTask = (id: string) => {
        touchTask(id, { archived: false });
    };

    const openModal = (
        taskId: string | null,
        type:
            | "SUBTASK"
            | "NOTE"
            | "BRAINSTORM"
            | "SETTINGS"
            | "ARCHIVE"
            | "ATTACHMENT"
            | "SHORTCUTS"
            | "STATS"
            | "NEW_LIST"
            | "SYNC",
    ) => {
        setActiveTaskID(taskId);
        setModalType(type);

        if (type === "BRAINSTORM") {
            setChatMessages([{ role: "assistant", content: "Hi! I'm here to help you plan. What's on your mind?" }]);
            setModalInput("");
        } else if (type === "NOTE" && taskId) {
            const task = tasks.find((t) => t.id === taskId);
            setModalInput(task?.notes || "");
        } else if (type === "SETTINGS") {
            setSettingsForm(pomoSettings);
        } else {
            setModalInput("");
            setAttachmentName("");
        }
        setModalOpen(true);
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (modalType === "SETTINGS") {
            const newSettings = {
                work: Number(settingsForm.work) || 25,
                shortBreak: Number(settingsForm.shortBreak) || 5,
                longBreak: Number(settingsForm.longBreak) || 15,
                interval: Number(settingsForm.interval) || 4,
                sound: settingsForm.sound || "bell",
            };
            setPomoSettings(newSettings);
            if (!isRunning) {
                if (mode === "work") setTimeLeft(newSettings.work * 60);
                else if (mode === "break") setTimeLeft(newSettings.shortBreak * 60);
                else if (mode === "longBreak") setTimeLeft(newSettings.longBreak * 60);
            }
            toast.info("Settings Saved");
            setModalOpen(false);
            return;
        }

        if (modalType === "BRAINSTORM") {
            const lines = modalInput.split("\n");
            lines.forEach((line) => {
                if (line.trim()) addTask(line);
            });
            setModalOpen(false);
            return;
        }

        if (!activeTaskID && modalType !== "ARCHIVE") return;

        if (modalType === "SUBTASK") {
            if (!modalInput.trim()) return;
            const subId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            const text = modalInput.trim();
            touchTask(activeTaskID!, (task) => ({
                subtasks: [...task.subtasks, { id: subId, text, completed: false }],
            }));
        } else if (modalType === "NOTE") {
            touchTask(activeTaskID!, { notes: modalInput.trim() });
        } else if (modalType === "ATTACHMENT") {
            if (!modalInput.trim()) return;
            const attId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            // Auto-name if empty
            let name = attachmentName.trim();
            if (!name) {
                try {
                    name = new URL(modalInput).hostname;
                } catch {
                    name = "Link";
                }
            }

            const url = modalInput.trim();
            touchTask(activeTaskID!, (task) => ({
                attachments: [...(task.attachments || []), { id: attId, name, url, type: "link" as const }],
            }));
            toast.success("Link Attached");
        }
        setModalOpen(false);
    };

    const toggleSubTask = (taskId: string, subTaskId: string) => {
        touchTask(taskId, (task) => ({
            subtasks: (task.subtasks || []).map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st)),
        }));
    };

    const deleteSubTask = (taskId: string, subTaskId: string) => {
        touchTask(taskId, (task) => ({
            subtasks: (task.subtasks || []).filter((st) => st.id !== subTaskId),
        }));
    };

    const deleteAttachment = (taskId: string, attId: string) => {
        touchTask(taskId, (task) => ({
            attachments: (task.attachments || []).filter((a) => a.id !== attId),
        }));
    };

    const toggleMinimize = () => {
        setIsTimerMinimized(!isTimerMinimized);
    };

    // "Today" is a virtual cross-list view: overdue + due-today tasks from every
    // list, plus pending undated recurring tasks. Derived only — nothing stored.
    const todayStr = localToday();
    const isTodayTask = (t: Task) =>
        !t.deletedAt &&
        !t.archived &&
        ((!!t.dueDate && t.dueDate <= todayStr) || (!t.dueDate && !!t.recurrence && !t.completed));

    // Filter tasks by active list (tombstoned tasks are hidden everywhere)
    const currentListTasks =
        activeListId === TODAY_LIST_ID ?
            tasks.filter(isTodayTask)
        :   tasks.filter((t) => !t.deletedAt && (t.listId || "default") === activeListId);
    const deletedTasks = tasks.filter((t) => t.deletedAt);
    const todayCount = tasks.filter((t) => isTodayTask(t) && !t.completed).length;
    const listNameById = new Map(lists.map((l) => [l.id, l.name]));

    const searchFilter = (t: Task) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            t.text.toLowerCase().includes(query) || t.tags?.some((tag) => tag.toLowerCase().includes(query)) || t.notes?.toLowerCase().includes(query)
        );
    };

    const activeTasks = currentListTasks.filter((t) => !t.completed && !t.archived && searchFilter(t));
    const completedTasks = currentListTasks.filter((t) => t.completed && !t.archived && searchFilter(t));
    const archivedTasks = currentListTasks.filter((t) => t.archived);

    // Sorting: High > Medium > Low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    // View-only ordering. Today always sorts by due date (manual order is
    // meaningless across lists); elsewhere sortMode applies. Stable sort keeps
    // manual order for ties, and "manual" returns the array untouched.
    const byPriority = (a: Task, b: Task) => priorityOrder[b.priority ?? "medium"] - priorityOrder[a.priority ?? "medium"];
    const byDue = (a: Task, b: Task) => {
        const ad = a.dueDate ?? "9999";
        const bd = b.dueDate ?? "9999";
        return ad < bd ? -1 : ad > bd ? 1 : byPriority(a, b);
    };
    const displayTasks =
        activeListId === TODAY_LIST_ID ? [...activeTasks].sort(byDue)
        : sortMode === "priority" ? [...activeTasks].sort(byPriority)
        : sortMode === "due" ? [...activeTasks].sort(byDue)
        : activeTasks;
    const reorderDisabled = sortMode !== "manual" || activeListId === TODAY_LIST_ID;

    const getSubtaskProgress = (t: Task) => {
        if (!t.subtasks || t.subtasks.length === 0) return 0;
        const completed = t.subtasks.filter((s) => s.completed).length;
        return completed / t.subtasks.length;
    };

    const handleReorder = (newActiveTasks: Task[]) => {
        // Splice the reordered tasks back into their previous slots in the full
        // array — building it from the filtered views would drop every task
        // outside the current list/search. No updatedAt stamp: order is not
        // per-task state, and stamping all of them would spam the sync merge.
        setTasks((prev) => {
            const ids = new Set(newActiveTasks.map((t) => t.id));
            let i = 0;
            return prev.map((t) => (ids.has(t.id) ? newActiveTasks[i++] : t));
        });
    };

    // Explicit reorder for mobile (no drag gesture — it would fight swipe-x and scroll)
    const moveTask = (id: string, dir: -1 | 1) => {
        if (activeListId === TODAY_LIST_ID) return; // Today is due-date ordered; entry points are hidden
        setTasks((prev) => {
            const active = prev.filter((t) => !t.deletedAt && (t.listId || "default") === activeListId && !t.completed && !t.archived);
            const idx = active.findIndex((t) => t.id === id);
            const swapWith = active[idx + dir];
            if (idx === -1 || !swapWith) return prev;
            // Swap the two tasks' slots in the full array (same technique as handleReorder)
            const i1 = prev.findIndex((t) => t.id === id);
            const i2 = prev.findIndex((t) => t.id === swapWith.id);
            const next = [...prev];
            [next[i1], next[i2]] = [next[i2], next[i1]];
            return next;
        });
    };

    const sheetTask = (sheetTaskId && tasks.find((t) => t.id === sheetTaskId && !t.deletedAt)) || null;
    const popoverTask = (popover && tasks.find((t) => t.id === popover.taskId && !t.deletedAt)) || null;

    const getTotalTime = () => {
        if (mode === "work") return pomoSettings.work * 60;
        if (mode === "break") return pomoSettings.shortBreak * 60;
        return pomoSettings.longBreak * 60;
    };

    const progress = timeLeft / getTotalTime();
    const strokeDasharray = 283;

    const getPriorityColor = (p?: string) => {
        if (p === "disaster") return "text-error";
        if (p === "high") return "text-error";
        if (p === "medium") return "text-warning";
        return "text-base-content/50";
    };

    const getIconForUrl = (url: string) => {
        try {
            const u = new URL(url);
            const domain = u.hostname.toLowerCase();
            const path = u.pathname.toLowerCase();

            // Services
            if (domain.includes("github.com")) return <FaGithub size={12} />;
            if (domain.includes("youtube.com") || domain.includes("youtu.be")) return <FaYoutube size={12} />;
            if (domain.includes("twitter.com") || domain.includes("x.com")) return <FaTwitter size={12} />;
            if (domain.includes("figma.com")) return <FaFigma size={12} />;
            if (domain.includes("instagram.com")) return <FaInstagram size={12} />;
            if (domain.includes("linkedin.com")) return <FaLinkedin size={12} />;
            if (domain.includes("codepen.io")) return <FaCodepen size={12} />;
            if (domain.includes("trello.com")) return <FaTrello size={12} />;
            if (domain.includes("slack.com")) return <FaSlack size={12} />;

            // Files by extension
            if (path.endsWith(".pdf") || path.endsWith(".doc") || path.endsWith(".docx") || path.endsWith(".txt")) return <FileText size={12} />;
            if (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".gif") || path.endsWith(".svg"))
                return <ImageIcon size={12} />;
            if (path.endsWith(".mp4") || path.endsWith(".mov") || path.endsWith(".avi")) return <Video size={12} />;
            if (
                path.endsWith(".js") ||
                path.endsWith(".ts") ||
                path.endsWith(".tsx") ||
                path.endsWith(".py") ||
                path.endsWith(".css") ||
                path.endsWith(".html")
            )
                return <FileCode size={12} />;

            // Default Web
            return <Globe size={12} />;
        } catch {
            return <ExternalLink size={12} />;
        }
    };

    const exportData = () => {
        const data = {
            tasks,
            lists,
            activeListId,
            savedLinks,
            notePages,
            settings: { timeLeft, mode, isTimerMinimized, pomoSettings },
            focusHistory,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workflow-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Data exported successfully!");
    };

    const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.tasks) setTasks(data.tasks);
                if (data.lists) setLists(data.lists);
                if (data.activeListId) setActiveListId(data.activeListId);
                if (data.savedLinks) setSavedLinks(data.savedLinks);
                if (data.notePages) setNotePages(data.notePages);
                if (data.focusHistory) setFocusHistory(data.focusHistory);
                if (data.settings) {
                    const s = data.settings;
                    if (s.timeLeft) setTimeLeft(s.timeLeft);
                    if (s.mode) setMode(s.mode);
                    if (s.pomoSettings) setPomoSettings(s.pomoSettings);
                    if (typeof s.isTimerMinimized === "boolean") setIsTimerMinimized(s.isTimerMinimized);
                }
                toast.success("Data imported successfully!");
                setModalOpen(false);
            } catch (err) {
                console.error(err);
                toast.error("Failed to import data: Invalid file");
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Calculate current streak (consecutive days with tasks completed)
    const calculateStreak = (): number => {
        if (focusHistory.length === 0) return 0;

        // Sort history by date descending
        const sorted = [...focusHistory].filter((h) => h.tasksCompleted && h.tasksCompleted > 0).sort((a, b) => b.date.localeCompare(a.date));

        if (sorted.length === 0) return 0;

        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        // Check if today or yesterday has activity (allow starting streak check from yesterday)
        const todayStr = checkDate.toISOString().split("T")[0];
        const yesterday = new Date(checkDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const hasToday = sorted.some((h) => h.date === todayStr);
        const hasYesterday = sorted.some((h) => h.date === yesterdayStr);

        if (!hasToday && !hasYesterday) return 0;

        // Start from today if active, otherwise yesterday
        if (!hasToday) {
            checkDate = yesterday;
        }

        // Count consecutive days backward
        while (true) {
            const dateStr = checkDate.toISOString().split("T")[0];
            if (sorted.some((h) => h.date === dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    };

    const currentStreak = calculateStreak();

    // --- Import / Export ---
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Sync Logic ---
    const handleSyncSetup = async (password: string) => {
        try {
            setIsSyncing(true);

            // 1. Check if server has data
            const res = await fetch("/api/sync");

            if (res.status === 401) {
                setUser(null);
                setIsSyncing(false);
                router.push("/api/auth/discord/login");
                return;
            }

            const serverData = await res.json();

            let key: CryptoKey;
            let salt = serverData.salt;

            // If we have a local salt but no key (Unlock mode), we MUST use the local salt if server matches or is empty?
            // Actually, if server has data, we trust server salt.
            // If server is empty, we use existing local salt if available, or generate new.
            if (!salt && syncSalt) salt = syncSalt;

            if (serverData.encryptedData && salt) {
                // Case A: Verify Password & Download
                key = await deriveKey(password, salt);
                try {
                    const decrypted = await decryptData(serverData.encryptedData, serverData.iv, key);
                    // Merge (per-task LWW) so unlocking sync never clobbers local work
                    if (decrypted) {
                        if (decrypted.tasks) setTasks((prev) => mergeTasks(prev, decrypted.tasks));
                        if (decrypted.lists) setLists((prev) => mergeLists(prev, decrypted.lists));
                        if (decrypted.activeListId) setActiveListId(decrypted.activeListId);
                        if (decrypted.savedLinks) setSavedLinks(decrypted.savedLinks);
                        if (decrypted.notePages) setNotePages(decrypted.notePages);
                        if (decrypted.settings) {
                            if (decrypted.settings.timeLeft) setTimeLeft(decrypted.settings.timeLeft);
                            if (decrypted.settings.mode) setMode(decrypted.settings.mode);
                            if (decrypted.settings.pomoSettings) setPomoSettings(decrypted.settings.pomoSettings);
                            if (typeof decrypted.settings.isTimerMinimized === "boolean") setIsTimerMinimized(decrypted.settings.isTimerMinimized);
                        }

                        const date = new Date(decrypted.updatedAt || Date.now());
                        setLastSyncTime(date);
                        toast.success(`Synced! (Last update: ${date.toLocaleTimeString()})`);
                    }
                } catch (e) {
                    toast.error("Incorrect password (decryption failed)");
                    setIsSyncing(false);
                    return;
                }
            } else {
                // Case B: First time setup / Upload
                if (!salt) {
                    // Fallback for browsers without randomUUID (e.g. non-secure contexts)
                    if ("randomUUID" in window.crypto) {
                        salt = window.crypto.randomUUID();
                    } else {
                        salt = (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
                            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
                        );
                    }
                }
                key = await deriveKey(password, salt);

                // Initial upload
                await performSync(key, salt);
                toast.success("Sync enabled & data uploaded!");
            }

            // Persist
            setSyncKey(key);
            setSyncSalt(salt);
            localStorage.setItem("workflow-sync-salt", salt);

            const jwk = await exportKey(key);
            localStorage.setItem("workflow-sync-key", JSON.stringify(jwk));

            setModalOpen(false);
        } catch (e: any) {
            console.error("Sync Setup Error:", e);
            toast.error(`Sync setup failed: ${e.message || e}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // Fix stale closure for polling
    const lastSyncTimeRef = useRef(lastSyncTime);
    useEffect(() => {
        lastSyncTimeRef.current = lastSyncTime;
    }, [lastSyncTime]);

    const syncInitialized = useRef(false);

    // Mirror of the synced slice of state so interval/async callbacks always
    // see fresh values (the old code read stale closures on every poll).
    const syncStateRef = useRef({ tasks, lists, activeListId, savedLinks, notePages, pomoSettings });
    useEffect(() => {
        syncStateRef.current = { tasks, lists, activeListId, savedLinks, notePages, pomoSettings };
    }, [tasks, lists, activeListId, savedLinks, notePages, pomoSettings]);

    // Echo suppression: snapshot of exactly what was last pushed or merged.
    // The push effect skips when state matches this — no timers, no races.
    // Volatile timer state (timeLeft/mode) is deliberately excluded.
    const lastSyncedSnapshot = useRef<string | null>(null);
    const snapshotOf = (d: typeof syncStateRef.current) => JSON.stringify(d);
    const isDirty = () => lastSyncedSnapshot.current !== null && snapshotOf(syncStateRef.current) !== lastSyncedSnapshot.current;

    // Quiet error policy: one toast when sync breaks, one when it recovers.
    const consecutiveFailures = useRef(0);
    const reportSyncFailure = () => {
        consecutiveFailures.current += 1;
        setSyncStatus("error");
        if (consecutiveFailures.current === 1) toast.warning("Sync paused — will retry");
    };
    const reportSyncSuccess = () => {
        if (consecutiveFailures.current > 0) toast.success("Sync restored");
        consecutiveFailures.current = 0;
    };

    const pullSync = async (key: CryptoKey, saltStr: string, force = false) => {
        try {
            // Add timestamp to prevent Next.js/Browser caching
            const res = await fetch(`/api/sync?t=${Date.now()}`, { cache: "no-store" });

            if (res.status === 401) {
                console.warn("Pull Sync: Not authenticated");
                setUser(null);
                return;
            }

            if (!res.ok) {
                console.error("Pull Sync Error Response", res.status, res.statusText);
                reportSyncFailure();
                return;
            }

            const data = await res.json();

            // If no data on server, mark as initialized so we can push our local data
            if (data.empty) {
                syncInitialized.current = true;
                return;
            }

            if (!data.encryptedData || !data.iv) {
                console.error("Invalid sync data format received");
                reportSyncFailure();
                return;
            }

            // Check version/concurrency (simple timestamp check)
            const remoteTime = new Date(data.updatedAt);
            // Use ref to get latest time inside interval
            // Bypass check if forced (Conflict Resolution)
            if (!force && lastSyncTimeRef.current && remoteTime <= lastSyncTimeRef.current) {
                syncInitialized.current = true; // We are up to date
                reportSyncSuccess();
                setSyncStatus((prev) => (prev === "dirty" || prev === "syncing" ? prev : "synced"));
                return;
            }

            const decrypted = await decryptData(data.encryptedData, data.iv, key);

            // Validate structure
            if (!decrypted.tasks || !decrypted.lists) {
                console.error("Decrypted data invalid structure");
                reportSyncFailure();
                return;
            }

            // Merge instead of replace: per-task LWW keeps local edits that the
            // remote blob doesn't know about yet (they push on the next debounce).
            const local = syncStateRef.current;
            const mergedTasks = mergeTasks(local.tasks, decrypted.tasks);
            const mergedLists = mergeLists(local.lists, decrypted.lists);
            const localClean = !isDirty();

            setTasks(mergedTasks);
            setLists(mergedLists);
            // Notes/links/settings have no per-item timestamps — apply remote
            // only when local has no unsynced changes (documented trade-off).
            if (decrypted.activeListId && localClean) setActiveListId(decrypted.activeListId);
            if (decrypted.savedLinks && localClean) setSavedLinks(decrypted.savedLinks);
            if (decrypted.notePages && localClean) setNotePages(decrypted.notePages);
            if (decrypted.settings?.pomoSettings && localClean) setPomoSettings(decrypted.settings.pomoSettings);

            // Snapshot from the values in hand (state updates are async). If the
            // merge kept local-only edits, the snapshot differs from state and
            // the push effect fires naturally, completing conflict resolution.
            lastSyncedSnapshot.current = snapshotOf({
                tasks: decrypted.tasks,
                lists: decrypted.lists,
                activeListId: decrypted.activeListId ?? local.activeListId,
                savedLinks: localClean ? (decrypted.savedLinks ?? local.savedLinks) : local.savedLinks,
                notePages: localClean ? (decrypted.notePages ?? local.notePages) : local.notePages,
                pomoSettings: localClean ? (decrypted.settings?.pomoSettings ?? local.pomoSettings) : local.pomoSettings,
            });

            setLastSyncTime(remoteTime);
            syncInitialized.current = true; // Mark as initialized after successful sync
            reportSyncSuccess();
            setSyncStatus("synced");
        } catch (e) {
            console.error("Pull Sync Exception", e);
            reportSyncFailure();
        }
    };

    const performSync = async (key: CryptoKey, saltStr: string) => {
        if (!key) return;

        const current = syncStateRef.current;
        const dataToEncrypt = {
            ...current,
            settings: { timeLeft, mode, isTimerMinimized, pomoSettings: current.pomoSettings },
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
                // Send the last time we synced (or null if new) to allow server to check for conflicts
                // If we have never synced (lastSyncTime is null), server allows it unless we want strict init
                lastUpdated: lastSyncTime ? lastSyncTime.toISOString() : null,
            }),
        });

        if (res.status === 409) {
            // Server has newer data — pull merges it in; the still-dirty snapshot
            // re-triggers the push, resolving the conflict in one round trip.
            console.warn("Sync Conflict Detected: Server has newer data. Merging...");
            await pullSync(key, saltStr, true);
            return;
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error("Sync Push Error:", err);
            reportSyncFailure();
            return;
        }

        // Push accepted — this exact payload is now the server state.
        lastSyncedSnapshot.current = snapshotOf(current);
        setLastSyncTime(new Date());
        reportSyncSuccess();
        setSyncStatus("synced");
    };

    // Auto-Sync Effect (Push)
    useEffect(() => {
        if (!syncKey || isSyncing || !syncSalt) return;

        // Only allow push if we have successfully synced with server at least once
        // This prevents overwriting server data with stale local data on initial load
        if (!syncInitialized.current) {
            return;
        }

        // Echo prevention: skip if state matches what was last pushed/merged
        if (lastSyncedSnapshot.current !== null && snapshotOf({ tasks, lists, activeListId, savedLinks, notePages, pomoSettings }) === lastSyncedSnapshot.current) {
            return;
        }

        setSyncStatus("dirty");
        const timeoutId = setTimeout(() => {
            performSync(syncKey, syncSalt);
        }, 5000); // Debounce 5s

        return () => clearTimeout(timeoutId);
    }, [tasks, lists, activeListId, savedLinks, notePages, pomoSettings, syncKey, syncSalt]);

    // Baseline status tracks whether sync is unlocked at all
    useEffect(() => {
        setSyncStatus(syncKey ? "synced" : "disabled");
    }, [syncKey]);

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
            addTask(add);
        }
        if (capture) {
            setActiveTab("tasks");
            setMobileTab("tasks");
            setTimeout(() => {
                const desktop = window.matchMedia("(min-width: 768px)").matches;
                (desktop ? addTaskInputRef : mobileAddInputRef).current?.focus();
            }, 50);
        }
        router.replace("/tasks", { scroll: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, isLoaded]);

    // Polling Effect (Pull)
    useEffect(() => {
        if (!syncKey || !syncSalt) return;

        // Initial Pull
        pullSync(syncKey, syncSalt);

        const interval = setInterval(() => {
            pullSync(syncKey, syncSalt);
        }, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [syncKey, syncSalt]);

    if (!isLoaded) {
        // Skeleton matching each layout's silhouette so hydration doesn't jump
        return (
            <div className="min-h-full w-full p-4 md:p-12 bg-base-100">
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

    return (
        <div className="min-h-full w-full p-4 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100 relative">
            {/* <Toaster position="top-center" theme="dark" /> Removed duplicate */}
            <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />

            {/* Desktop Layout */}
            <div className="hidden md:block space-y-8">
                {/* Header */}
                {!isZenMode && (
                    <motion.div layout className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <button onClick={() => setIsListDropdownOpen(!isListDropdownOpen)} className="flex items-center gap-2 group">
                                    <h1 className="text-3xl md:text-5xl font-extrabold text-base-content tracking-tight">
                                        {activeListId === TODAY_LIST_ID ? "Today" : lists.find((l) => l.id === activeListId)?.name || "My Tasks"}
                                    </h1>
                                    <ChevronDown
                                        size={24}
                                        className={clsx("text-base-content/50 group-hover:text-base-content/80 transition-all", isListDropdownOpen && "rotate-180")}
                                    />
                                </button>
                                <p className="text-base-content/50 mt-2 font-medium">Capture ideas. Stay focused.</p>

                                {/* List Dropdown */}
                                <AnimatePresence>
                                    {isListDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 mt-2 w-64 bg-base-200 border border-base-content/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-2 space-y-1">
                                                {/* Virtual Today view — pinned, cross-list, no delete */}
                                                <div
                                                    className={clsx(
                                                        "group/item w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium",
                                                        activeListId === TODAY_LIST_ID ?
                                                            "bg-primary text-primary-content"
                                                        :   "text-base-content/70 hover:bg-base-content/5 hover:text-base-content",
                                                    )}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setActiveListId(TODAY_LIST_ID);
                                                            setIsListDropdownOpen(false);
                                                        }}
                                                        className="flex-1 text-left flex items-center gap-2"
                                                    >
                                                        <Sun size={16} />
                                                        Today
                                                        {todayCount > 0 && (
                                                            <span
                                                                className={clsx(
                                                                    "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                                                                    activeListId === TODAY_LIST_ID ?
                                                                        "bg-primary-content/20"
                                                                    :   "bg-base-content/10 text-base-content/70",
                                                                )}
                                                            >
                                                                {todayCount}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                                {lists.map((list) => (
                                                    <div
                                                        key={list.id}
                                                        className={clsx(
                                                            "group/item w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium",
                                                            activeListId === list.id ?
                                                                "bg-primary text-primary-content"
                                                            :   "text-base-content/70 hover:bg-base-content/5 hover:text-base-content",
                                                        )}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setActiveListId(list.id);
                                                                setIsListDropdownOpen(false);
                                                            }}
                                                            className="flex-1 text-left"
                                                        >
                                                            {list.name}
                                                        </button>
                                                        {list.id !== "default" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteList(list.id);
                                                                }}
                                                                className={clsx(
                                                                    "p-1.5 rounded-md transition-colors",
                                                                    activeListId === list.id ?
                                                                        "text-base-content/50 hover:text-error hover:bg-primary/80"
                                                                    :   "text-base-content/50 hover:text-error hover:bg-base-content/10 opacity-100 md:opacity-0 md:group-hover/item:opacity-100",
                                                                )}
                                                                title="Delete List"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}{" "}
                                            </div>
                                            <div className="border-t border-base-content/5 p-2">
                                                <button
                                                    onClick={() => {
                                                        setIsListDropdownOpen(false);
                                                        setModalInput("");
                                                        setModalType("NEW_LIST");
                                                        setModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-base-content/50 hover:bg-base-content/5 hover:text-base-content transition-colors font-medium"
                                                >
                                                    <FolderPlus size={18} />
                                                    Create New List
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mini Timer */}
                            <AnimatePresence>
                                {isTimerMinimized && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="hidden md:flex items-center gap-4 px-4 py-2 bg-base-content/5 rounded-2xl border border-base-content/5 backdrop-blur-md"
                                    >
                                        <span className="text-2xl font-bold text-base-content tabular-nums">{formatTime(timeLeft)}</span>
                                        <div className="flex bg-base-300/50 rounded-lg p-1">
                                            <div className={clsx("w-2 h-2 rounded-full mx-1", mode === "work" ? "bg-primary" : "bg-base-300")} />
                                            <div className={clsx("w-2 h-2 rounded-full mx-1", mode !== "work" ? "bg-primary" : "bg-base-300")} />
                                        </div>
                                        <button
                                            onClick={toggleTimer}
                                            className="btn btn-circle btn-sm bg-primary hover:bg-primary/90 text-primary-content border-none"
                                        >
                                            {isRunning ?
                                                <Pause size={14} fill="currentColor" />
                                            :   <Play size={14} fill="currentColor" className="ml-0.5" />}
                                        </button>
                                        <button
                                            onClick={toggleMinimize}
                                            title="Expand Timer"
                                            className="btn btn-circle btn-sm btn-ghost hover:bg-base-content/10 text-base-content/70"
                                        >
                                            <Maximize2 size={16} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-2 items-center">
                            {/* Streak Badge */}
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
                                <button
                                    onClick={requestNotificationPermission}
                                    className="btn btn-circle btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content"
                                    title="Enable Notifications"
                                >
                                    <Bell size={24} />
                                </button>
                            )}

                            {/* Sync Status Overlay Indicator */}
                            <div className="relative group">
                                <button
                                    onClick={() => {
                                        if (!user && syncKey) {
                                            router.push("/api/auth/discord/login");
                                            return;
                                        }
                                        if (!user && !syncKey) {
                                            router.push("/api/auth/discord/login");
                                            return;
                                        }
                                        openModal(null, "SYNC");
                                    }}
                                    className={clsx(
                                        "btn btn-circle btn-ghost hover:bg-base-content/10 relative",
                                        syncStatus === "syncing" || isSyncing ? "text-secondary animate-pulse"
                                        : syncStatus === "error" ? "text-error"
                                        : syncStatus === "dirty" ? "text-info"
                                        : syncKey && user ? "text-success"
                                        : syncKey && !user ? "text-warning"
                                        : "text-base-content/50",
                                    )}
                                    title={
                                        syncStatus === "syncing" || isSyncing ? "Syncing..."
                                        : syncStatus === "error" ? "Sync paused — retrying"
                                        : syncStatus === "dirty" ? "Unsynced changes — saving shortly"
                                        : syncKey && user ?
                                            `Encrypted Sync Active${lastSyncTime ? ` — synced ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}` : ""}`
                                        : syncKey && !user ? "Session expired — click to login"
                                        : "Sync Disabled — click to login"
                                    }
                                >
                                    <Cloud size={24} />
                                    {syncKey && (
                                        <span className={clsx(
                                            "absolute bottom-2 right-2 w-2 h-2 rounded-full border border-base-100",
                                            syncStatus === "error" ? "bg-error"
                                            : syncStatus === "dirty" ? "bg-info"
                                            : user ? "bg-success"
                                            : "bg-warning"
                                        )}></span>
                                    )}
                                </button>
                            </div>

                            {/* Music Player Toggle */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMusicPanel(!showMusicPanel)}
                                    className={clsx(
                                        "btn btn-circle btn-ghost hover:bg-base-content/10",
                                        isMusicPlaying ? "text-success" : "text-base-content/50 hover:text-base-content",
                                    )}
                                    title={isMusicPlaying ? "Music playing" : "Focus music"}
                                >
                                    <Headphones size={24} />
                                </button>

                                {/* Music Panel */}
                                <AnimatePresence>
                                    {showMusicPanel && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full right-0 mt-2 p-4 bg-base-200 border border-base-content/10 rounded-xl shadow-2xl z-50 w-96"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-base-content/80">Focus Music</span>
                                                {musicMode === "radio" && (
                                                    <button
                                                        onClick={() => {
                                                            if (musicRef.current) {
                                                                if (isMusicPlaying) {
                                                                    musicRef.current.pause();
                                                                } else {
                                                                    musicRef.current.play().catch((e) => console.log("Music play failed", e));
                                                                }
                                                                setIsMusicPlaying(!isMusicPlaying);
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "btn btn-sm btn-circle",
                                                            isMusicPlaying ? "bg-success text-success-content" : "bg-base-300 text-base-content/80",
                                                        )}
                                                    >
                                                        {isMusicPlaying ?
                                                            <Pause size={14} />
                                                        :   <Play size={14} />}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Mode Toggle */}
                                            <div className="flex bg-base-300/40 p-1 rounded-lg mb-4">
                                                <button
                                                    onClick={() => {
                                                        setMusicMode("radio");
                                                    }}
                                                    className={clsx(
                                                        "flex-1 text-xs py-1.5 font-medium rounded-md transition-all",
                                                        musicMode === "radio" ? "bg-base-300 text-base-content shadow-sm" : (
                                                            "text-base-content/50 hover:text-base-content/80"
                                                        ),
                                                    )}
                                                >
                                                    Radio
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMusicMode("spotify");
                                                        // Pause radio if playing
                                                        if (isMusicPlaying && musicRef.current) {
                                                            musicRef.current.pause();
                                                            setIsMusicPlaying(false);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "flex-1 text-xs py-1.5 font-medium rounded-md transition-all",
                                                        musicMode === "spotify" ? "bg-[#1DB954] text-black shadow-sm" : (
                                                            "text-base-content/50 hover:text-base-content/80"
                                                        ),
                                                    )}
                                                >
                                                    Spotify
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMusicMode("video");
                                                        // Pause radio if playing
                                                        if (isMusicPlaying && musicRef.current) {
                                                            musicRef.current.pause();
                                                            setIsMusicPlaying(false);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "flex-1 text-xs py-1.5 font-medium rounded-md transition-all",
                                                        musicMode === "video" ? "bg-error text-white shadow-sm" : (
                                                            "text-base-content/50 hover:text-base-content/80"
                                                        ),
                                                    )}
                                                >
                                                    Video
                                                </button>
                                            </div>

                                            {musicMode === "radio" ?
                                                <>
                                                    {/* Station Selector */}
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        {RADIO_STATIONS.map((station, i) => (
                                                            <button
                                                                key={station.name}
                                                                onClick={() => {
                                                                    setCurrentStation(i);
                                                                    if (musicRef.current) {
                                                                        musicRef.current.src = station.url;
                                                                        musicRef.current.volume = musicVolume;
                                                                        if (isMusicPlaying) {
                                                                            musicRef.current.play().catch((e) => console.log("Music play failed", e));
                                                                        } else {
                                                                            // Auto play on switch? Maybe better UX
                                                                            musicRef.current.play().catch((e) => console.log("Music play failed", e));
                                                                            setIsMusicPlaying(true);
                                                                        }
                                                                    }
                                                                }}
                                                                className={clsx(
                                                                    "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left truncate",
                                                                    currentStation === i ?
                                                                        `${station.color} text-white`
                                                                    :   "bg-base-content/5 text-base-content/70 hover:bg-base-content/10",
                                                                )}
                                                            >
                                                                {station.name}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <VolumeX size={16} className="text-base-content/50" />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.1"
                                                            value={musicVolume}
                                                            onChange={(e) => {
                                                                const vol = parseFloat(e.target.value);
                                                                setMusicVolume(vol);
                                                                if (musicRef.current) {
                                                                    musicRef.current.volume = vol;
                                                                }
                                                            }}
                                                            className="flex-1 accent-success h-1 bg-base-300 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <Volume2 size={16} className="text-base-content/50" />
                                                    </div>
                                                </>
                                            : musicMode === "spotify" ?
                                                <SpotifyWidget />
                                            :   <div className="space-y-3">
                                                    <p className="text-xs text-base-content/50 font-medium">Video Stream</p>

                                                    {/* Stream Type Toggle */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => setStreamType("youtube")}
                                                            className={clsx(
                                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                                                streamType === "youtube" ? "bg-error text-white" : "bg-base-content/5 text-base-content/70",
                                                            )}
                                                        >
                                                            <FaYoutube size={14} /> YouTube
                                                        </button>
                                                        <button
                                                            onClick={() => setStreamType("twitch")}
                                                            className={clsx(
                                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                                                streamType === "twitch" ? "bg-secondary text-white" : "bg-base-content/5 text-base-content/70",
                                                            )}
                                                        >
                                                            <Video size={14} /> Twitch
                                                        </button>
                                                    </div>

                                                    {/* URL Input */}
                                                    <input
                                                        type="text"
                                                        placeholder={
                                                            streamType === "youtube" ? "Video ID (e.g., jfKfPfyJRdk)" : (
                                                                "Channel name (e.g., lolostream)"
                                                            )
                                                        }
                                                        value={customStreamUrl}
                                                        onChange={(e) => setCustomStreamUrl(e.target.value)}
                                                        className="w-full bg-base-300/40 text-base-content/80 text-xs px-3 py-2 rounded-lg border border-base-content/10 focus:border-base-content/40 outline-none"
                                                    />

                                                    {/* Quick Presets */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setStreamType("youtube");
                                                                setCustomStreamUrl("jfKfPfyJRdk");
                                                            }}
                                                            className="flex-1 px-2 py-1 bg-base-content/5 hover:bg-base-content/10 rounded text-xs text-base-content/70"
                                                        >
                                                            Lofi Girl
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setStreamType("youtube");
                                                                setCustomStreamUrl("rUxyKA_-grg");
                                                            }}
                                                            className="flex-1 px-2 py-1 bg-base-content/5 hover:bg-base-content/10 rounded text-xs text-base-content/70"
                                                        >
                                                            Chillhop
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setShowYouTubePlayer(!showYouTubePlayer);
                                                            if (isMusicPlaying && musicRef.current) {
                                                                musicRef.current.pause();
                                                                setIsMusicPlaying(false);
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                                            showYouTubePlayer ? "bg-error text-white" : "bg-primary text-primary-content hover:bg-primary/90",
                                                        )}
                                                    >
                                                        {showYouTubePlayer ? "Close Player" : "Open Player"}
                                                    </button>
                                                </div>
                                            }
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {user && (
                                <div className="flex items-center gap-3 mr-4 pl-4 border-l border-base-content/10">
                                    {user.avatar ?
                                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-base-content/10" />
                                    :   <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    }
                                    <span className="text-sm font-medium text-base-content/70 hidden md:block">{user.username}</span>
                                </div>
                            )}

                            <button
                                onClick={() => openModal(null, "STATS")}
                                className="btn btn-circle btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content"
                                title="Statistics"
                            >
                                <BarChart size={24} />
                            </button>
                            <button
                                onClick={() => setIsZenMode(true)}
                                className="btn btn-circle btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content"
                                title="Enter Zen Mode"
                            >
                                <Eye size={24} />
                            </button>
                            <button
                                onClick={() => openModal(null, "BRAINSTORM")}
                                className="btn btn-circle btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content"
                                title="Brainstorm Mode"
                            >
                                <BrainCircuit size={28} />
                            </button>
                            {archivedTasks.length > 0 && (
                                <button
                                    onClick={() => openModal(null, "ARCHIVE")}
                                    className="btn btn-circle btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content relative"
                                    title={`Archived Tasks (${archivedTasks.length})`}
                                >
                                    <Archive size={24} />
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-base-300 rounded-full text-[10px] flex items-center justify-center text-base-content/70 border border-base-content/10">
                                        {archivedTasks.length}
                                    </span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Hidden Audio Element for Radio */}
                <audio ref={musicRef} className="hidden" crossOrigin="anonymous" />

                {/* Zen Mode Exit Button */}
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

                {/* Quick Links Bar */}
                {!isZenMode && (
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2">
                            {savedLinks.slice(0, 8).map((link) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-base-content/5 hover:bg-base-content/10 rounded-lg text-sm text-base-content/70 hover:text-base-content/80 whitespace-nowrap transition-colors group"
                                >
                                    <Globe size={12} className="flex-shrink-0" />
                                    {link.title}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSavedLinks(savedLinks.filter((l) => l.id !== link.id));
                                        }}
                                        className="text-base-content/30 hover:text-error opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={12} />
                                    </button>
                                </a>
                            ))}
                            {savedLinks.length === 0 && <span className="text-base-content/50 text-sm">No quick links yet</span>}
                        </div>

                        {/* Add Link Button */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newLinkUrl.trim()) {
                                    const url = newLinkUrl.trim().startsWith("http") ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
                                    try {
                                        const hostname = new URL(url).hostname.replace("www.", "");
                                        const newLink = {
                                            id: Date.now().toString(36),
                                            title: newLinkTitle.trim() || hostname,
                                            url,
                                            createdAt: new Date().toISOString(),
                                        };
                                        setSavedLinks([...savedLinks, newLink]);
                                        setNewLinkTitle("");
                                        setNewLinkUrl("");
                                        toast.success("Link added!");
                                    } catch {
                                        toast.error("Invalid URL");
                                    }
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                placeholder="+ Add link..."
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                className="w-40 bg-transparent text-base-content/70 text-sm px-3 py-1.5 border border-base-content/10 rounded-lg focus:outline-none focus:border-base-content/40"
                            />
                        </form>

                        {/* Notes Toggle */}
                        <button
                            onClick={() => setActiveTab(activeTab === "notes" ? "tasks" : "notes")}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                activeTab === "notes" ? "bg-warning/20 text-warning" : "text-base-content/50 hover:text-base-content/80 hover:bg-base-content/5",
                            )}
                            title="Toggle Notes Panel"
                        >
                            <FileText size={20} />
                        </button>
                    </div>
                )}

                {/* Notes Panel (Slide in from right) */}
                <AnimatePresence>
                    {activeTab === "notes" && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveTab("tasks")}
                                className="fixed inset-0 bg-black/50 z-30"
                            />
                            <motion.div
                                initial={{ opacity: 0, x: 300 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 300 }}
                                className="fixed top-0 right-0 w-full md:w-[60%] h-full bg-base-200 border-l border-base-content/10 z-40 shadow-2xl flex flex-col"
                            >
                                <div className="flex items-center justify-between p-4 border-b border-base-content/10">
                                    <h3 className="text-lg font-bold text-base-content">📝 Notes</h3>
                                    <button onClick={() => setActiveTab("tasks")} className="text-base-content/50 hover:text-base-content">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Page Tabs */}
                                <div className="flex items-center gap-2 p-3 border-b border-base-content/10 overflow-x-auto">
                                    {notePages.map((page) => (
                                        <button
                                            key={page.id}
                                            onClick={() => setActiveNoteId(page.id)}
                                            onDoubleClick={() => setEditingNoteId(page.id)}
                                            className={clsx(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 group",
                                                activeNoteId === page.id ?
                                                    "bg-primary text-primary-content"
                                                :   "bg-base-content/5 text-base-content/70 hover:text-base-content/80",
                                            )}
                                        >
                                            {editingNoteId === page.id ?
                                                <input
                                                    type="text"
                                                    defaultValue={page.title}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    onBlur={(e) => {
                                                        setNotePages(
                                                            notePages.map((p) =>
                                                                p.id === page.id ? { ...p, title: e.target.value || "Untitled" } : p,
                                                            ),
                                                        );
                                                        setEditingNoteId(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            setNotePages(
                                                                notePages.map((p) =>
                                                                    p.id === page.id ?
                                                                        { ...p, title: (e.target as HTMLInputElement).value || "Untitled" }
                                                                    :   p,
                                                                ),
                                                            );
                                                            setEditingNoteId(null);
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingNoteId(null);
                                                        }
                                                    }}
                                                    className="bg-transparent border-none outline-none w-20 text-inherit"
                                                />
                                            :   page.title}
                                            {notePages.length > 1 && editingNoteId !== page.id && (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newPages = notePages.filter((p) => p.id !== page.id);
                                                        setNotePages(newPages);
                                                        if (activeNoteId === page.id && newPages.length > 0) {
                                                            setActiveNoteId(newPages[0].id);
                                                        }
                                                    }}
                                                    className="text-base-content/50 hover:text-error opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={12} />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const newId = Date.now().toString(36);
                                            setNotePages([...notePages, { id: newId, title: `Page ${notePages.length + 1}`, content: "" }]);
                                            setActiveNoteId(newId);
                                        }}
                                        className="px-2 py-1.5 text-base-content/50 hover:text-base-content/80 hover:bg-base-content/10 rounded-lg text-sm"
                                        title="Add new page"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {(() => {
                                    const activePage = notePages.find((p) => p.id === activeNoteId) || notePages[0];

                                    return (
                                        <>
                                            <NoteEditor
                                                variant="desktop"
                                                content={activePage?.content || ""}
                                                onChange={(c) =>
                                                    setNotePages(notePages.map((p) => (p.id === activeNoteId ? { ...p, content: c } : p)))
                                                }
                                            />
                                            <div className="p-3 border-t border-base-content/10 text-xs text-base-content/50 text-center">
                                                Auto-saved • {activePage?.content.length || 0} characters
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className={clsx("grid gap-8", isZenMode ? "grid-cols-1 max-w-5xl mx-auto" : "lg:grid-cols-3")}>
                    {/* Left Col: Timer & Stats (Unchanged) */}
                    <AnimatePresence>
                        {!isTimerMinimized && !isZenMode && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="lg:col-span-1 space-y-6 overflow-hidden"
                            >
                                <motion.div
                                    layout
                                    className="relative overflow-hidden rounded-3xl bg-base-content/5 backdrop-blur-xl border border-base-content/5 p-8 shadow-2xl flex flex-col items-center"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => openModal(null, "SETTINGS")}
                                            className="text-base-content/50 hover:text-base-content/80 transition-colors"
                                            title="Timer Settings"
                                        >
                                            <Settings size={20} />
                                        </button>
                                        <button
                                            onClick={toggleMinimize}
                                            className="text-base-content/50 hover:text-base-content/80 transition-colors"
                                            title="Minimize Timer"
                                        >
                                            <Minimize2 size={20} />
                                        </button>
                                    </div>

                                    <div className="flex justify-center gap-2 mb-8 relative z-10 p-1 bg-base-300/40 rounded-full">
                                        {["work", "break", "longBreak"].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => switchMode(m as any)}
                                                className={clsx(
                                                    "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                                                    mode === m ? "bg-primary text-primary-content shadow-lg" : "text-base-content/50 hover:text-base-content/80",
                                                )}
                                            >
                                                {m === "longBreak" ? "Long Break" : m.charAt(0).toUpperCase() + m.slice(1)}
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
                                                strokeDasharray={strokeDasharray}
                                                initial={{ strokeDashoffset: 0 }}
                                                animate={{ strokeDashoffset: strokeDasharray * (1 - progress) }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="text-6xl font-bold tracking-tighter text-base-content tabular-nums">
                                                {formatTime(timeLeft)}
                                            </div>
                                            <div className="text-sm font-mono text-base-content/50 mt-2">
                                                Session {(sessionsCompleted % pomoSettings.interval) + 1}/{pomoSettings.interval}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Task Display */}
                                    {currentTaskId && (
                                        <div className="mb-6 px-4 py-3 bg-warning/10 border border-warning/20 rounded-xl text-center">
                                            <div className="text-xs text-warning/70 uppercase font-bold mb-1">Focusing On</div>
                                            <div className="text-sm text-base-content/80 font-medium truncate">
                                                {tasks.find((t) => t.id === currentTaskId)?.text || "Unknown Task"}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-center gap-4 relative z-10 w-full">
                                        <button
                                            onClick={toggleTimer}
                                            className="btn btn-circle btn-lg bg-primary hover:bg-primary/90 text-primary-content border-none hover:scale-105 transition-all shadow-xl shadow-base-content/10"
                                        >
                                            {isRunning ?
                                                <Pause fill="currentColor" />
                                            :   <Play fill="currentColor" className="ml-1" />}
                                        </button>
                                        <button
                                            onClick={resetTimer}
                                            className="btn btn-circle btn-lg btn-ghost hover:bg-base-content/10 text-base-content/50 hover:text-base-content"
                                        >
                                            <RotateCcw size={24} />
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Right Col: Tasks */}
                    <motion.div
                        layout
                        className={clsx(
                            "transition-all duration-500",
                            isZenMode ? "col-span-1"
                            : isTimerMinimized ? "lg:col-span-3"
                            : "lg:col-span-2",
                        )}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" as const }}
                            className="rounded-3xl bg-base-200/50 border border-base-content/5 p-4 md:p-8 h-[calc(100vh-6rem)] shadow-xl flex flex-col overflow-hidden"
                        >
                            {/* Header / Search / Input Section - FIXED */}
                            <div className="flex-shrink-0">
                                {/* Search Input */}
                                <div className="relative mb-4">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-base-content/5 text-base-content/80 pl-10 pr-4 py-2.5 rounded-xl border border-base-content/10 focus:outline-none focus:border-base-content/40 text-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content/80"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleAddTask} className="relative mb-6 group">
                                    <input
                                        ref={addTaskInputRef}
                                        type="text"
                                        placeholder="What's your focus today?"
                                        title="Quick add: #tag !priority @due — e.g. 'Ship blog post #work !high @fri'"
                                        className="w-full bg-transparent text-xl md:text-2xl font-medium text-base-content placeholder:text-base-content/50 border-b-2 border-base-content/5 py-4 focus:outline-none focus:border-primary transition-colors pl-2"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity btn btn-circle btn-sm btn-ghost text-base-content"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </form>

                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h2 className="text-xl font-bold text-base-content">Active Tasks</h2>
                                    {/* Sort control — hidden in Today (always due-date ordered there) */}
                                    {activeListId !== TODAY_LIST_ID && (
                                        <div className="flex items-center gap-1 bg-base-content/5 rounded-lg p-1" title="Sort tasks">
                                            <ArrowUpDown size={14} className="text-base-content/40 ml-1.5 mr-0.5" />
                                            {(
                                                [
                                                    { id: "manual", label: "Manual" },
                                                    { id: "priority", label: "Priority" },
                                                    { id: "due", label: "Due" },
                                                ] as const
                                            ).map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSortMode(m.id)}
                                                    className={clsx(
                                                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                                        sortMode === m.id ?
                                                            "bg-base-300 text-base-content shadow-sm"
                                                        :   "text-base-content/50 hover:text-base-content/80",
                                                    )}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Task List */}
                            <div className="flex-1 overflow-y-auto overflow-x-visible px-3 py-2 custom-scrollbar min-h-0">
                                <Reorder.Group axis="y" values={displayTasks} onReorder={reorderDisabled ? () => {} : handleReorder} className="space-y-3 pb-8">
                                    <AnimatePresence initial={false}>
                                        {displayTasks.map((task) => {
                                            const prog = getSubtaskProgress(task);

                                            return (
                                                <Reorder.Item
                                                    key={task.id}
                                                    value={task}
                                                    dragListener={!reorderDisabled}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                                    exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" as const }}
                                                    whileHover={{ scale: 1.005, backgroundColor: "rgba(255,255,255,0.05)" }}
                                                    className={clsx(
                                                        "relative flex flex-col p-4 rounded-xl border transition-colors bg-base-content/5",
                                                        currentTaskId === task.id ?
                                                            "border-warning/50 ring-2 ring-inset ring-warning/20 shadow-lg shadow-warning/10"
                                                        :   "border-transparent",
                                                    )}
                                                >
                                                    {/* Progress Bar Background */}
                                                    {prog > 0 && (
                                                        <div
                                                            className="absolute bottom-0 left-0 h-1 bg-success/20"
                                                            style={{ width: `${prog * 100}%` }}
                                                        />
                                                    )}

                                                    <div className="flex items-center gap-4 relative z-10">
                                                        {!reorderDisabled && (
                                                            <div className="cursor-grab active:cursor-grabbing text-base-content/50 hover:text-base-content/70">
                                                                <GripVertical size={18} />
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => toggleTask(task.id)}
                                                            className="w-6 h-6 rounded-full border-2 border-base-content/40 hover:border-primary flex items-center justify-center transition-colors flex-shrink-0"
                                                        ></button>

                                                        {/* Task Text - Double-click to edit */}
                                                        {editingTaskId === task.id ?
                                                            <input
                                                                type="text"
                                                                defaultValue={task.text}
                                                                autoFocus
                                                                onBlur={(e) => {
                                                                    const newText = e.target.value.trim();
                                                                    if (newText && newText !== task.text) {
                                                                        touchTask(task.id, { text: newText });
                                                                        toast.success("Task updated");
                                                                    }
                                                                    setEditingTaskId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        (e.target as HTMLInputElement).blur();
                                                                    }
                                                                    if (e.key === "Escape") {
                                                                        setEditingTaskId(null);
                                                                    }
                                                                }}
                                                                className="flex-1 text-lg font-medium text-base-content/80 bg-transparent border-b-2 border-base-content/40 focus:border-primary outline-none px-1 py-0"
                                                            />
                                                        :   <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                                <span
                                                                    onDoubleClick={() => setEditingTaskId(task.id)}
                                                                    className="w-full text-lg font-medium select-none truncate text-base-content/80 cursor-text hover:text-base-content block"
                                                                    title="Double-click to edit"
                                                                >
                                                                    {task.text}
                                                                </span>
                                                                {/* In the cross-list Today view, show which list a task belongs to */}
                                                                {activeListId === TODAY_LIST_ID && (
                                                                    <span className="self-start px-2 py-0.5 rounded-md text-[11px] font-medium border bg-base-content/5 text-base-content/50 border-base-content/10">
                                                                        {listNameById.get(task.listId || "default") ?? "My Tasks"}
                                                                    </span>
                                                                )}
                                                                {task.tags && task.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {task.tags.map((tagId) => {
                                                                            const tag = TASK_TAGS.find((t) => t.id === tagId);
                                                                            if (!tag) return null;

                                                                            return (
                                                                                <span
                                                                                    key={tag.id}
                                                                                    className={clsx(
                                                                                        "px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide border",
                                                                                        tag.color.replace("bg-", "bg-").replace("500", "500/10"),
                                                                                        tag.color.replace("bg-", "text-").replace("500", "400"),
                                                                                        tag.color.replace("bg-", "border-").replace("500", "500/20"),
                                                                                    )}
                                                                                >
                                                                                    {tag.label}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        }

                                                        <div className="flex gap-1 items-center">
                                                            <button
                                                                onClick={() => cyclePriority(task.id)}
                                                                className={clsx("p-2 rounded-lg transition-colors", getPriorityColor(task.priority))}
                                                                title={`Priority: ${task.priority || "medium"}`}
                                                            >
                                                                <Flag
                                                                    size={18}
                                                                    fill={
                                                                        task.priority === "high" || task.priority === "medium" ?
                                                                            "currentColor"
                                                                        :   "none"
                                                                    }
                                                                />
                                                            </button>

                                                            {/* Recurrence Toggle */}
                                                            <button
                                                                onClick={() => cycleRecurrence(task.id)}
                                                                className={clsx(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    task.recurrence === "daily" && "text-info bg-info/20",
                                                                    task.recurrence === "weekly" && "text-secondary bg-secondary/20",
                                                                    task.recurrence === "monthly" && "text-success bg-success/20",
                                                                    !task.recurrence && "text-base-content/50 hover:text-base-content hover:bg-base-content/10",
                                                                )}
                                                                title={task.recurrence ? `Repeats ${task.recurrence}` : "Set recurrence"}
                                                            >
                                                                <Repeat size={18} />
                                                            </button>

                                                            <div className="w-px h-4 bg-base-content/10 mx-1" />

                                                            <button
                                                                onClick={() => openModal(task.id, "ATTACHMENT")}
                                                                className={clsx(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    task.attachments && task.attachments.length > 0 ?
                                                                        "text-base-content bg-base-content/10"
                                                                    :   "text-base-content/50 hover:text-base-content hover:bg-base-content/10",
                                                                )}
                                                                title="Attach Link"
                                                            >
                                                                <Paperclip size={18} />
                                                            </button>

                                                            <button
                                                                onClick={() => openModal(task.id, "NOTE")}
                                                                className={clsx(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    task.notes ? "text-base-content bg-base-content/10" : (
                                                                        "text-base-content/50 hover:text-base-content hover:bg-base-content/10"
                                                                    ),
                                                                )}
                                                                title="Notes"
                                                            >
                                                                <FileText size={18} />
                                                            </button>

                                                            {/* Focus Button */}
                                                            <button
                                                                onClick={() => setCurrentTaskId(currentTaskId === task.id ? null : task.id)}
                                                                className={clsx(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    currentTaskId === task.id ?
                                                                        "text-warning bg-warning/20"
                                                                    :   "text-base-content/50 hover:text-warning hover:bg-base-content/10",
                                                                )}
                                                                title={currentTaskId === task.id ? "Unfocus" : "Focus on task"}
                                                            >
                                                                <Target size={18} />
                                                            </button>

                                                            {/* Pomodoro Badge - Clickable to set estimate */}
                                                            <button
                                                                onClick={(e) => setPopover({ type: "estimate", taskId: task.id, anchorEl: e.currentTarget })}
                                                                className="flex items-center gap-1 px-2 py-1 bg-base-content/5 hover:bg-base-content/10 rounded-lg text-xs font-mono transition-colors"
                                                                title="Set pomodoro estimate"
                                                            >
                                                                <span className="text-error">🍅</span>
                                                                <span className="text-base-content/70">
                                                                    {task.actualPomos || 0}/{task.estimatedPomos || "?"}
                                                                </span>
                                                            </button>

                                                            {/* Due Date Button */}
                                                            <button
                                                                onClick={(e) => setPopover({ type: "due", taskId: task.id, anchorEl: e.currentTarget })}
                                                                className={clsx(
                                                                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                                                                    task.dueDate ?
                                                                        (() => {
                                                                            // Parse date in local timezone by appending time
                                                                            const dueDate = new Date(task.dueDate + "T00:00:00");
                                                                            const today = new Date();
                                                                            today.setHours(0, 0, 0, 0);
                                                                            if (dueDate < today) return "bg-error/20 text-error";
                                                                            if (dueDate.getTime() === today.getTime())
                                                                                return "bg-warning/20 text-warning";
                                                                            return "bg-base-content/5 text-base-content/70";
                                                                        })()
                                                                    :   "bg-base-content/5 text-base-content/50 hover:text-base-content/80",
                                                                )}
                                                                title={
                                                                    task.dueDate ?
                                                                        `Due: ${new Date(task.dueDate + "T00:00:00").toLocaleDateString()}`
                                                                    :   "Set due date"
                                                                }
                                                            >
                                                                <Calendar size={14} />
                                                                {task.dueDate && (
                                                                    <span>
                                                                        {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                        })}
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {/* Move to List - Only show if multiple lists */}
                                                            {lists.length > 1 && (
                                                                <button
                                                                    onClick={(e) => setPopover({ type: "move", taskId: task.id, anchorEl: e.currentTarget })}
                                                                    className="p-2 text-base-content/50 hover:text-base-content hover:bg-base-content/10 rounded-lg"
                                                                    title="Move to another list"
                                                                >
                                                                    <Move size={18} />
                                                                </button>
                                                            )}

                                                            {/* Tags Button */}
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    className={clsx(
                                                                        "p-2 rounded-lg transition-colors",
                                                                        task.tags && task.tags.length > 0 ?
                                                                            "text-base-content bg-base-content/10"
                                                                        :   "text-base-content/50 hover:text-base-content hover:bg-base-content/10",
                                                                    )}
                                                                    title="Tags"
                                                                    aria-haspopup="menu"
                                                                    aria-expanded={openTagMenuTaskId === task.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTagMenuAnchorEl(e.currentTarget);
                                                                        setOpenTagMenuTaskId((prev) => (prev === task.id ? null : task.id));
                                                                    }}
                                                                >
                                                                    <Tag size={18} />
                                                                </button>
                                                                <TaskTagsMenu
                                                                    open={openTagMenuTaskId === task.id}
                                                                    anchorEl={openTagMenuTaskId === task.id ? tagMenuAnchorEl : null}
                                                                    tags={TASK_TAGS}
                                                                    selectedTagIds={task.tags ?? []}
                                                                    onToggleTag={(tagId) => toggleTag(task.id, tagId)}
                                                                    onClose={() => setOpenTagMenuTaskId(null)}
                                                                />
                                                            </div>

                                                            <button
                                                                onClick={() => deleteTask(task.id)}
                                                                className="p-2 text-error/40 hover:text-error hover:bg-error/10 rounded-lg"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Notes Preview */}
                                                    {task.notes && (
                                                        <div className="pl-12 mt-2 text-sm text-base-content/70 font-serif prose prose-sm max-w-none relative z-10">
                                                            <ReactMarkdown>{task.notes}</ReactMarkdown>
                                                        </div>
                                                    )}

                                                    {/* Subtasks */}
                                                    <div className="pl-12 space-y-2 mt-2 relative z-10">
                                                        <AnimatePresence>
                                                            {(task.subtasks || []).map((sub) => (
                                                                <motion.div
                                                                    key={sub.id}
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="flex items-center gap-3 text-sm"
                                                                >
                                                                    <CornerDownRight size={14} className="text-base-content/30" />
                                                                    <button
                                                                        onClick={() => toggleSubTask(task.id, sub.id)}
                                                                        className="p-2 -m-2 flex items-center justify-center flex-shrink-0"
                                                                    >
                                                                        <span
                                                                            className={clsx(
                                                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                                                sub.completed ? "bg-base-content/40 border-base-content/40" : (
                                                                                    "border-base-content/25 hover:border-base-content/40"
                                                                                ),
                                                                            )}
                                                                        >
                                                                            {sub.completed && <Check size={10} className="text-base-100" />}
                                                                        </span>
                                                                    </button>
                                                                    <span
                                                                        className={clsx(
                                                                            "flex-1 text-base-content/70 transition-colors",
                                                                            sub.completed && "line-through text-base-content/30",
                                                                        )}
                                                                    >
                                                                        {sub.text}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => deleteSubTask(task.id, sub.id)}
                                                                        className="text-base-content/30 hover:text-error transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>

                                                        {/* Quick Add Subtask */}
                                                        <div className="flex items-center gap-3 text-sm group/addsub opacity-50 hover:opacity-100 transition-opacity">
                                                            <CornerDownRight size={14} className="text-base-content/30" />
                                                            <Plus size={14} className="text-base-content/50" />
                                                            <input
                                                                type="text"
                                                                placeholder="Add subtask..."
                                                                className="flex-1 bg-transparent text-base-content/70 placeholder:text-base-content/30 outline-none text-sm"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                                                        const text = (e.target as HTMLInputElement).value.trim();
                                                                        const subId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                                                                        touchTask(task.id, (t) => ({
                                                                            subtasks: [...t.subtasks, { id: subId, text, completed: false }],
                                                                        }));
                                                                        (e.target as HTMLInputElement).value = "";
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Attachments */}
                                                    {task.attachments && task.attachments.length > 0 && (
                                                        <div className="group/list pl-12 mt-3 flex flex-wrap gap-2 relative z-10">
                                                            {task.attachments.map((att) => (
                                                                <div
                                                                    key={att.id}
                                                                    className="group flex items-center gap-2 bg-base-300/50 border border-base-content/5 rounded-full px-3 py-1 text-xs text-base-content/80 hover:bg-base-300/70 transition-colors"
                                                                >
                                                                    <a
                                                                        href={att.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 hover:text-base-content"
                                                                    >
                                                                        {getIconForUrl(att.url)}
                                                                        <span className="max-w-[150px] truncate">{att.name}</span>
                                                                    </a>
                                                                    <button
                                                                        onClick={() => deleteAttachment(task.id, att.id)}
                                                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-base-content/50 hover:text-error p-2 -m-1"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => openModal(task.id, "ATTACHMENT")}
                                                                className="opacity-100 md:opacity-0 md:group-hover/list:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-full bg-base-300 border border-base-content/10 text-base-content/50 hover:text-base-content hover:bg-base-300/70"
                                                                title="Add another link"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <div className="absolute top-2 right-2 text-[10px] font-mono text-base-content/50 opacity-50 relative z-10">
                                                            {Math.round(prog * 100)}%
                                                        </div>
                                                    )}
                                                </Reorder.Item>
                                            );
                                        })}
                                    </AnimatePresence>
                                </Reorder.Group>
                            </div>

                            {/* Completed Tasks */}
                            {completedTasks.length > 0 && (
                                <div className="transition-opacity">
                                    <button
                                        onClick={() => setShowCompleted(!showCompleted)}
                                        className="flex items-center gap-2 mb-4 px-2 w-full group"
                                    >
                                        <ChevronDown
                                            size={16}
                                            className={clsx("text-base-content/50 transition-transform", !showCompleted && "-rotate-90")}
                                        />
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
                                                            onClick={() => toggleTask(task.id)}
                                                            className="w-6 h-6 rounded-full border-2 bg-base-content/50 border-base-content/40 flex items-center justify-center transition-colors flex-shrink-0"
                                                        >
                                                            <Check size={14} className="text-base-100" />
                                                        </button>
                                                        <span className="flex-1 text-lg font-medium select-none truncate line-through text-base-content/50">
                                                            {task.text}
                                                        </span>
                                                        {/* Archive Button */}
                                                        <button
                                                            onClick={() => archiveTask(task.id)}
                                                            className="p-2 text-base-content/50 hover:text-base-content/80 transition-colors"
                                                            title="Archive"
                                                        >
                                                            <Archive size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteTask(task.id)}
                                                            className="p-2 text-base-content/30 hover:text-error transition-colors"
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
                        </motion.div>
                    </motion.div>
                </div>

                {/* Floating Video Player */}
                <AnimatePresence>
                    {showYouTubePlayer && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="fixed bottom-8 right-8 z-50 bg-base-200 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-2 bg-base-300/50">
                                <span className="text-sm font-bold text-base-content/80">{streamType === "youtube" ? "🎵 YouTube" : "🎮 Twitch"}</span>
                                <button onClick={() => setShowYouTubePlayer(false)} className="text-base-content/50 hover:text-base-content">
                                    <X size={18} />
                                </button>
                            </div>
                            {streamType === "youtube" ?
                                <iframe
                                    width="320"
                                    height="180"
                                    src={`https://www.youtube.com/embed/${customStreamUrl || "jfKfPfyJRdk"}?autoplay=1`}
                                    title="YouTube Player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="border-0"
                                />
                            :   <div className="flex flex-col">
                                    <iframe
                                        src={`https://player.twitch.tv/?channel=${customStreamUrl || "lofiradio"}&parent=localhost&parent=mkhawam.com&parent=www.mkhawam.com`}
                                        width="320"
                                        height="180"
                                        allowFullScreen
                                        className="border-0"
                                    />
                                    <a
                                        href={`https://www.twitch.tv/${customStreamUrl || "lofiradio"}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-center text-secondary hover:text-secondary/80 py-2 bg-base-300/50"
                                    >
                                        Open in new tab if embed fails →
                                    </a>
                                </div>
                            }
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden fixed inset-0 z-40 bg-base-100 flex flex-col h-[100dvh] supports-[height:100svh]:h-[100svh] overflow-hidden">
                {/* Mobile Header */}
                <div className="p-4 flex items-center justify-between shrink-0">
                    <h1 className="text-2xl font-bold text-base-content">
                        {mobileTab === "tasks" &&
                            (activeListId === TODAY_LIST_ID ? "Today" : lists.find((l) => l.id === activeListId)?.name || "My Tasks")}
                        {mobileTab === "focus" && "Focus Timer"}
                        {mobileTab === "notes" && "Notes"}
                        {mobileTab === "menu" && "Menu"}
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Mobile Header Actions */}
                        <button
                            onClick={() => {
                                if (!user) {
                                    router.push("/api/auth/discord/login");
                                    return;
                                }
                                openModal(null, "SYNC");
                            }}
                            className={clsx(
                                "btn btn-ghost btn-circle btn-sm",
                                syncStatus === "syncing" ? "text-secondary animate-pulse"
                                : syncStatus === "error" ? "text-error"
                                : syncStatus === "dirty" ? "text-info"
                                : syncKey && user ? "text-success"
                                : syncKey && !user ? "text-warning"
                                : "text-base-content/50",
                            )}
                            aria-label="Sync status"
                        >
                            <Cloud size={20} />
                        </button>
                        <button onClick={() => openModal(null, "SETTINGS")} className="btn btn-ghost btn-circle btn-sm">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Mobile Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {mobileTab === "tasks" && (
                        <>
                            {/* Fixed Top Controls (List Selector + Input) */}
                            <div className="px-4 pb-2 bg-base-100 z-20 shrink-0 border-b border-base-content/5 pt-2">
                                <div className="space-y-4">
                                    {/* Mobile List Selector */}
                                    <div className="flex gap-2 bg-base-content/5 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                                        <button
                                            onClick={() => setActiveListId(TODAY_LIST_ID)}
                                            className={clsx(
                                                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                                                activeListId === TODAY_LIST_ID ?
                                                    "bg-primary text-primary-content"
                                                :   "text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80",
                                            )}
                                        >
                                            <Sun size={14} />
                                            Today
                                            {todayCount > 0 && (
                                                <span
                                                    className={clsx(
                                                        "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                                                        activeListId === TODAY_LIST_ID ? "bg-primary-content/20" : "bg-base-content/10",
                                                    )}
                                                >
                                                    {todayCount}
                                                </span>
                                            )}
                                        </button>
                                        {lists.map((list) => (
                                            <button
                                                key={list.id}
                                                onClick={() => setActiveListId(list.id)}
                                                className={clsx(
                                                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                                    activeListId === list.id ?
                                                        "bg-primary text-primary-content"
                                                    :   "text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80",
                                                )}
                                            >
                                                {list.name}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => openModal(null, "NEW_LIST")}
                                            className="px-3 py-2 rounded-lg text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <div className="flex-1" />
                                        {activeListId !== TODAY_LIST_ID && (
                                            <button
                                                onClick={() => {
                                                    const next =
                                                        sortMode === "manual" ? "priority"
                                                        : sortMode === "priority" ? "due"
                                                        : "manual";
                                                    setSortMode(next);
                                                    toast.info(`Sort: ${next === "manual" ? "Manual" : next === "priority" ? "Priority" : "Due date"}`);
                                                }}
                                                className={clsx(
                                                    "px-3 py-2 rounded-lg transition-colors",
                                                    sortMode !== "manual" ? "text-primary" : "text-base-content/50",
                                                )}
                                                aria-label="Cycle sort mode"
                                            >
                                                <ArrowUpDown size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (mobileSearchOpen) setSearchQuery(""); // collapsing must clear the invisible filter
                                                setMobileSearchOpen(!mobileSearchOpen);
                                            }}
                                            className={clsx(
                                                "px-3 py-2 rounded-lg transition-colors",
                                                searchQuery.trim() ? "text-primary"
                                                : mobileSearchOpen ? "text-base-content"
                                                : "text-base-content/50",
                                            )}
                                            aria-label="Search tasks"
                                        >
                                            <Search size={16} />
                                        </button>
                                    </div>

                                    {/* Collapsible Search */}
                                    {mobileSearchOpen && (
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                                            <input
                                                type="text"
                                                placeholder="Search tasks..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                                className="w-full bg-base-content/5 text-base-content/80 pl-9 pr-9 py-2.5 rounded-xl border border-base-content/10 focus:outline-none focus:border-base-content/40 text-sm"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-base-content/50"
                                                    aria-label="Clear search"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Task Input */}
                                    <form onSubmit={handleAddTask} className="flex gap-2">
                                        <input
                                            ref={mobileAddInputRef}
                                            type="text"
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            placeholder="Add task… #tag !high @fri"
                                            className="flex-1 bg-base-content/5 border border-base-content/10 rounded-xl px-4 py-3 text-base-content focus:outline-none focus:border-base-content/40"
                                        />
                                        <button type="submit" className="bg-primary text-primary-content rounded-xl px-4 font-bold">
                                            <Plus />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Scrollable Task List */}
                            <div className="flex-1 overflow-y-auto p-4 pt-4 scrollbar-hide overscroll-none pb-24">
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {displayTasks.map((task) => (
                                            <motion.div
                                                key={task.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0, x: 0 }} // Reset x to 0
                                                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                                className="relative group"
                                            >
                                                <MobileTaskCard
                                                    task={task}
                                                    listName={
                                                        activeListId === TODAY_LIST_ID ?
                                                            (listNameById.get(task.listId || "default") ?? "My Tasks")
                                                        :   undefined
                                                    }
                                                    isFocused={currentTaskId === task.id}
                                                    onToggle={() => toggleTask(task.id)}
                                                    onDelete={() => deleteTask(task.id)}
                                                    onOpenSheet={() => setSheetTaskId(task.id)}
                                                    onToggleSubtask={(subId) => toggleSubTask(task.id, subId)}
                                                    onAddSubtask={(text) => {
                                                        const subId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                                                        touchTask(task.id, (t) => ({
                                                            subtasks: [...(t.subtasks || []), { id: subId, text, completed: false }],
                                                        }));
                                                    }}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {displayTasks.length === 0 && (
                                        <div className="text-center py-20 text-base-content/50">
                                            {activeListId === TODAY_LIST_ID ? "Nothing due today 🎉" : "No active tasks"}
                                        </div>
                                    )}

                                    {/* Completed Tasks (Mobile) */}
                                    {completedTasks.length > 0 && (
                                        <div className="mt-8 pt-4 border-t border-base-content/5">
                                            <button
                                                onClick={() => setShowCompleted(!showCompleted)}
                                                className="flex items-center gap-2 mb-3 px-2 w-full"
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={clsx("text-base-content/50 transition-transform", !showCompleted && "-rotate-90")}
                                                />
                                                <h3 className="text-sm font-bold text-base-content/50">Completed ({completedTasks.length})</h3>
                                            </button>

                                            <AnimatePresence>
                                                {showCompleted && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-3 overflow-hidden opacity-60"
                                                    >
                                                        {completedTasks.map((task) => (
                                                            <div
                                                                key={task.id}
                                                                className="relative p-4 bg-base-200/50 border border-base-content/5 rounded-2xl flex items-start gap-3 transition-colors"
                                                            >
                                                                {/* Checkbox is the only un-complete target */}
                                                                <button
                                                                    onClick={() => toggleTask(task.id)}
                                                                    className="w-11 h-11 -m-2.5 mt-[-7px] flex items-center justify-center flex-shrink-0"
                                                                    aria-label="Mark incomplete"
                                                                >
                                                                    <span className="w-6 h-6 rounded-full border-2 border-success bg-success flex items-center justify-center">
                                                                        <Check size={14} className="text-success-content" />
                                                                    </span>
                                                                </button>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="text-lg block truncate text-base-content/50 line-through">
                                                                        {task.text}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => deleteTask(task.id)}
                                                                    className="w-11 h-11 -m-1.5 flex items-center justify-center text-base-content/50 hover:text-error"
                                                                    aria-label="Delete task"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {mobileTab === "focus" && (
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
                                        strokeDasharray={283}
                                        strokeDashoffset={
                                            283 *
                                            (1 -
                                                timeLeft /
                                                    ((mode === "work" ? pomoSettings.work
                                                    : mode === "break" ? pomoSettings.shortBreak
                                                    : pomoSettings.longBreak) *
                                                        60))
                                        }
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="flex flex-col items-center">
                                    <div className="text-6xl font-bold text-base-content tabular-nums">{formatTime(timeLeft)}</div>
                                    <div className="text-base-content/50 uppercase tracking-widest text-sm mt-2">{mode}</div>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <button
                                    onClick={() => {
                                        if (isRunning) {
                                            toggleTimer();
                                        } else {
                                            toggleTimer();
                                        }
                                    }}
                                    className={clsx(
                                        "btn btn-circle btn-xl w-24 h-24 shadow-2xl",
                                        isRunning ? "bg-base-300 text-error border-error/20" : "bg-primary text-primary-content",
                                    )}
                                >
                                    {isRunning ?
                                        <Pause size={40} />
                                    :   <Play size={40} className="ml-2" />}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                {(
                                    [
                                        { id: "work", label: "Focus" },
                                        { id: "break", label: "Break" },
                                        { id: "longBreak", label: "Long Break" },
                                    ] as const
                                ).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => switchMode(m.id)}
                                        className={clsx(
                                            "px-5 py-2 rounded-full font-medium",
                                            mode === m.id ? "bg-base-content/10 text-base-content border border-base-content/20" : "text-base-content/50",
                                        )}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mobileTab === "notes" && (
                        <div className="h-full flex flex-col">
                            {/* Mobile Note Page Selector */}
                            <div className="flex gap-2 bg-base-content/5 p-1 rounded-xl mb-2 overflow-x-auto scrollbar-hide shrink-0">
                                {notePages.map((page) => (
                                    <button
                                        key={page.id}
                                        onClick={() => setActiveNoteId(page.id)}
                                        className={clsx(
                                            "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                            activeNoteId === page.id ?
                                                "bg-primary text-primary-content"
                                            :   "text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80",
                                        )}
                                    >
                                        {page.title}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        const newId = Date.now().toString();
                                        setNotePages([...notePages, { id: newId, title: "New Page", content: "" }]);
                                        setActiveNoteId(newId);
                                    }}
                                    className="px-3 py-2 rounded-lg text-base-content/50 hover:bg-base-content/5 hover:text-base-content/80"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <NoteEditor
                                variant="mobile"
                                content={notePages.find((n) => n.id === activeNoteId)?.content || ""}
                                onChange={(c) => setNotePages(notePages.map((p) => (p.id === activeNoteId ? { ...p, content: c } : p)))}
                            />
                        </div>
                    )}

                    {mobileTab === "menu" && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => openModal(null, "SETTINGS")}
                                className="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-base-content">
                                    <Settings size={20} />
                                </div>
                                <span className="font-medium text-base-content/80">Settings</span>
                            </button>
                            <button
                                onClick={() => openModal(null, "STATS")}
                                className="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-info/20 text-info flex items-center justify-center">
                                    <BarChart size={20} />
                                </div>
                                <span className="font-medium text-base-content/80">Stats</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!user) {
                                        router.push("/api/auth/discord/login");
                                        return;
                                    }
                                    if (syncKey && syncSalt) {
                                        pullSync(syncKey, syncSalt);
                                        toast.info("Checking for updates...");
                                    }
                                    openModal(null, "SYNC");
                                }}
                                className="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                                    <Cloud size={20} />
                                </div>
                                <span className="font-medium text-base-content/80">Sync Data</span>
                            </button>
                            <button
                                onClick={() => openModal(null, "ARCHIVE")}
                                className="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-warning/20 text-warning flex items-center justify-center">
                                    <Archive size={20} />
                                </div>
                                <span className="font-medium text-base-content/80">Archive</span>
                            </button>
                            <button
                                onClick={() => openModal(null, "BRAINSTORM")}
                                className="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                <span className="font-medium text-base-content/80">Brainstorm</span>
                            </button>
                            <button
                                onClick={() => openModal(null, "SHORTCUTS")}
                                className="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center">
                                    <Keyboard size={20} />
                                </div>
                                <span className="font-medium text-base-content/80">Shortcuts</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Nav */}
                <div className="w-full bg-base-100/95 backdrop-blur-xl border-t border-base-content/10 grid grid-cols-4 shrink-0 h-16 pb-safe">
                    <button
                        onClick={() => setMobileTab("tasks")}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-0.5 active:bg-base-content/5 transition-colors",
                            mobileTab === "tasks" ? "text-base-content" : "text-base-content/50",
                        )}
                    >
                        <Home size={20} strokeWidth={mobileTab === "tasks" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Tasks</span>
                    </button>
                    <button
                        onClick={() => setMobileTab("focus")}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-0.5 active:bg-base-content/5 transition-colors",
                            mobileTab === "focus" ? "text-base-content" : "text-base-content/50",
                        )}
                    >
                        <Clock size={20} strokeWidth={mobileTab === "focus" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Focus</span>
                    </button>
                    <button
                        onClick={() => setMobileTab("notes")}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-0.5 active:bg-base-content/5 transition-colors",
                            mobileTab === "notes" ? "text-base-content" : "text-base-content/50",
                        )}
                    >
                        <FileText size={20} strokeWidth={mobileTab === "notes" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Notes</span>
                    </button>
                    <button
                        onClick={() => setMobileTab("menu")}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-0.5 active:bg-base-content/5 transition-colors",
                            mobileTab === "menu" ? "text-base-content" : "text-base-content/50",
                        )}
                    >
                        <Menu size={20} strokeWidth={mobileTab === "menu" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </div>
            </div>

            {/* Hidden Audio Elements */}
            <audio ref={musicRef} src={RADIO_STATIONS[currentStation]?.url || RADIO_STATIONS[0].url} loop />

            {/* Desktop anchored editors (due date / move / estimate) */}
            <AnchorPopover
                open={!!popover && !!popoverTask}
                anchorEl={popover?.anchorEl ?? null}
                onClose={() => setPopover(null)}
                width={popover?.type === "due" ? 260 : 220}
                maxHeight={320}
            >
                {popover?.type === "due" && popoverTask && (
                    <div className="space-y-2 p-1">
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: "Today", value: format(new Date(), "yyyy-MM-dd") },
                                { label: "Tomorrow", value: format(addDays(new Date(), 1), "yyyy-MM-dd") },
                                { label: "Next week", value: format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
                            ].map((c) => (
                                <button
                                    key={c.label}
                                    onClick={() => {
                                        touchTask(popoverTask.id, { dueDate: c.value });
                                        setPopover(null);
                                    }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        popoverTask.dueDate === c.value ?
                                            "bg-primary text-primary-content"
                                        :   "bg-base-content/5 text-base-content/70 hover:bg-base-content/10",
                                    )}
                                >
                                    {c.label}
                                </button>
                            ))}
                            {popoverTask.dueDate && (
                                <button
                                    onClick={() => {
                                        touchTask(popoverTask.id, { dueDate: undefined });
                                        setPopover(null);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-base-content/5 text-error hover:bg-error/10"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <input
                            type="date"
                            value={popoverTask.dueDate || ""}
                            onChange={(e) => touchTask(popoverTask.id, { dueDate: e.target.value || undefined })}
                            className="w-full bg-base-300/40 text-sm text-base-content border border-base-content/10 rounded-lg p-2 focus:outline-none focus:border-base-content/40"
                        />
                    </div>
                )}
                {popover?.type === "move" && popoverTask && (
                    <div className="space-y-1">
                        {lists
                            .filter((l) => l.id !== (popoverTask.listId || "default"))
                            .map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => {
                                        touchTask(popoverTask.id, { listId: list.id });
                                        setPopover(null);
                                        toast.success(`Moved to "${list.name}"`);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:bg-base-content/5 hover:text-base-content flex items-center gap-2"
                                >
                                    <FolderInput size={14} className="text-base-content/50" />
                                    {list.name}
                                </button>
                            ))}
                    </div>
                )}
                {popover?.type === "estimate" && popoverTask && (
                    <div className="flex items-center justify-between gap-2 p-1">
                        <button
                            onClick={() => touchTask(popoverTask.id, { estimatedPomos: Math.max(0, (popoverTask.estimatedPomos || 0) - 1) || undefined })}
                            className="w-9 h-9 rounded-lg bg-base-content/5 hover:bg-base-content/10 text-base-content text-lg font-bold"
                        >
                            −
                        </button>
                        <div className="text-sm font-mono text-base-content">
                            🍅 {popoverTask.actualPomos || 0}/{popoverTask.estimatedPomos || "?"}
                        </div>
                        <button
                            onClick={() => touchTask(popoverTask.id, { estimatedPomos: (popoverTask.estimatedPomos || 0) + 1 })}
                            className="w-9 h-9 rounded-lg bg-base-content/5 hover:bg-base-content/10 text-base-content text-lg font-bold"
                        >
                            +
                        </button>
                    </div>
                )}
            </AnchorPopover>

            {/* Mobile Task Action Sheet */}
            <TaskActionSheet
                task={sheetTask}
                lists={lists}
                tags={TASK_TAGS}
                canReorder={!reorderDisabled}
                isFocused={sheetTask ? currentTaskId === sheetTask.id : false}
                onClose={() => setSheetTaskId(null)}
                onUpdate={(patch) => sheetTask && touchTask(sheetTask.id, patch)}
                onToggleTag={(tagId) => sheetTask && toggleTag(sheetTask.id, tagId)}
                onDelete={() => {
                    if (sheetTask) {
                        deleteTask(sheetTask.id);
                        setSheetTaskId(null);
                    }
                }}
                onArchive={() => {
                    if (sheetTask) {
                        archiveTask(sheetTask.id);
                        setSheetTaskId(null);
                    }
                }}
                onToggleFocus={() => sheetTask && setCurrentTaskId(currentTaskId === sheetTask.id ? null : sheetTask.id)}
                onMove={(dir) => sheetTask && moveTask(sheetTask.id, dir)}
                onOpenNotes={() => {
                    if (sheetTask) {
                        setSheetTaskId(null);
                        openModal(sheetTask.id, "NOTE");
                    }
                }}
                onOpenAttachment={() => {
                    if (sheetTask) {
                        setSheetTaskId(null);
                        openModal(sheetTask.id, "ATTACHMENT");
                    }
                }}
                onOpenSubtask={() => {
                    if (sheetTask) {
                        setSheetTaskId(null);
                        openModal(sheetTask.id, "SUBTASK");
                    }
                }}
            />

            {/* Global Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={clsx(
                                "relative w-full bg-base-200 border border-base-content/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col",
                                modalType === "NOTE" || modalType === "BRAINSTORM" ? "max-w-5xl h-[80vh]" : "max-w-lg",
                            )}
                        >
                            <div
                                className={clsx(
                                    "p-6 overflow-y-auto",
                                    modalType === "NOTE" || modalType === "BRAINSTORM" ? "flex-1 flex flex-col" : "",
                                )}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        {modalType === "BRAINSTORM" && <Sparkles size={20} className="text-base-content" />}
                                        {modalType === "SETTINGS" && <Settings size={20} className="text-base-content" />}
                                        {modalType === "ARCHIVE" && <Archive size={20} className="text-base-content" />}
                                        {modalType === "ATTACHMENT" && <Paperclip size={20} className="text-base-content" />}
                                        {modalType === "SHORTCUTS" && <Keyboard size={20} className="text-base-content" />}
                                        {modalType === "STATS" && <BarChart3 size={20} />}
                                        {modalType === "NEW_LIST" && <FolderPlus size={20} />}
                                        <h3 className="text-xl font-bold text-base-content">
                                            {modalType === "SUBTASK" && "Add Subtask"}
                                            {modalType === "NOTE" && "Notes"}
                                            {modalType === "BRAINSTORM" && "AI Assistant"}
                                            {modalType === "SETTINGS" && "Timer Settings"}
                                            {modalType === "ARCHIVE" && "Archived Tasks"}
                                            {modalType === "ATTACHMENT" && "Add Link Attachment"}
                                            {modalType === "SHORTCUTS" && "Keyboard Shortcuts"}
                                            {modalType === "STATS" && "Productivity Stats & Summary"}
                                            {modalType === "NEW_LIST" && "Create New List"}
                                        </h3>
                                    </div>
                                    <button type="button" onClick={() => setModalOpen(false)} className="text-base-content/50 hover:text-base-content">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Content Switch */}
                                {modalType === "ARCHIVE" && (
                                    <div className="space-y-4">
                                        {archivedTasks.length === 0 ?
                                            <div className="text-center text-base-content/50 py-8">No archived tasks found.</div>
                                        :   <div className="space-y-2">
                                                {archivedTasks.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className="flex items-center gap-3 p-3 bg-base-content/5 rounded-lg border border-base-content/5"
                                                    >
                                                        <span className="flex-1 text-base-content/70 line-through text-sm">{task.text}</span>
                                                        <button
                                                            onClick={() => unarchiveTask(task.id)}
                                                            className="p-2 hover:bg-base-content/10 rounded text-base-content/50 hover:text-base-content"
                                                            title="Restore"
                                                        >
                                                            <RotateCw size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteTask(task.id)}
                                                            className="p-2 hover:bg-error/20 rounded text-error/50 hover:text-error"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        }

                                        {/* Recently Deleted (tombstones, purged after 30 days) */}
                                        {deletedTasks.length > 0 && (
                                            <div className="pt-4 border-t border-base-content/5">
                                                <h4 className="text-sm font-bold text-base-content/50 uppercase mb-3">Recently Deleted</h4>
                                                <div className="space-y-2">
                                                    {deletedTasks.map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-center gap-3 p-3 bg-error/5 rounded-lg border border-error/10"
                                                        >
                                                            <span className="flex-1 text-base-content/50 line-through text-sm">{task.text}</span>
                                                            <button
                                                                onClick={() => restoreTask(task.id)}
                                                                className="p-2 hover:bg-base-content/10 rounded text-base-content/50 hover:text-base-content"
                                                                title="Restore"
                                                            >
                                                                <RotateCw size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {modalType === "SUBTASK" && (
                                    <form onSubmit={handleModalSubmit}>
                                        <input
                                            ref={modalInputRef as any}
                                            type="text"
                                            value={modalInput}
                                            onChange={(e) => setModalInput(e.target.value)}
                                            placeholder="What needs to be done?"
                                            className="w-full bg-base-300/40 text-lg text-base-content border border-base-content/10 rounded-xl p-4 focus:outline-none focus:border-base-content/40 transition-colors"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn btn-ghost hover:bg-base-content/5 text-base-content/70"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn bg-primary hover:bg-primary/90 text-primary-content border-none px-6">
                                                Add Task
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {modalType === "ATTACHMENT" && (
                                    <form onSubmit={handleModalSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-sm font-bold text-base-content/50 uppercase">Link URL</label>
                                            <input
                                                ref={modalInputRef as any}
                                                type="url"
                                                value={modalInput}
                                                onChange={(e) => setModalInput(e.target.value)}
                                                placeholder="https://drive.google.com/..."
                                                className="w-full bg-base-300/40 text-lg text-base-content border border-base-content/10 rounded-xl p-4 mt-2 focus:outline-none focus:border-base-content/40 transition-colors"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-base-content/50 uppercase">Display Name (Optional)</label>
                                            <input
                                                type="text"
                                                value={attachmentName}
                                                onChange={(e) => setAttachmentName(e.target.value)}
                                                placeholder="Project Spec, Figma Board, etc."
                                                className="w-full bg-base-300/40 text-lg text-base-content border border-base-content/10 rounded-xl p-4 mt-2 focus:outline-none focus:border-base-content/40 transition-colors"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn btn-ghost hover:bg-base-content/5 text-base-content/70"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn bg-primary hover:bg-primary/90 text-primary-content border-none px-6">
                                                Add Link
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {modalType === "BRAINSTORM" && (
                                    <BrainstormingModal onAddTask={(text, subtasks) => addTask(text, subtasks)} onClose={() => setModalOpen(false)} />
                                )}

                                {modalType === "NOTE" && (
                                    <form onSubmit={handleModalSubmit} className="flex flex-col gap-4 flex-1 h-full">
                                        <textarea
                                            ref={modalInputRef as any}
                                            value={modalInput}
                                            onChange={(e) => setModalInput(e.target.value)}
                                            placeholder="Add details, links, or thoughts... (Markdown supported)"
                                            className="w-full bg-base-300/40 text-base text-base-content/80 border border-base-content/10 rounded-xl p-4 focus:outline-none focus:border-base-content/40 transition-colors resize-none leading-relaxed h-full flex-1"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn btn-ghost hover:bg-base-content/5 text-base-content/70"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn bg-primary hover:bg-primary/90 text-primary-content border-none px-6">
                                                Save Notes
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {modalType === "SYNC" && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSyncSetup(modalInput);
                                        }}
                                        className="flex flex-col gap-4"
                                    >
                                        <div className="text-center mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-secondary/20">
                                                <Lock size={32} className="text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-base-content">Setup Secure Sync</h3>
                                            <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                                                Enter a <span className="text-base-content/80 font-medium">Sync Password</span> to encrypt your data. This
                                                password never leaves your device. Existing data will be downloaded, or we'll upload your current
                                                tasks.
                                            </p>
                                        </div>

                                        <div>
                                            {/* Hidden Username Field for Autocomplete */}
                                            <input type="text" name="username" value="Sync" readOnly autoComplete="username" className="hidden" />
                                            <label className="text-xs font-bold text-base-content/50 uppercase ml-1">Sync Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={modalInput}
                                                onChange={(e) => setModalInput(e.target.value)}
                                                placeholder="Enter your secret password..."
                                                autoComplete="current-password"
                                                className="w-full bg-base-300/40 text-lg text-base-content border border-base-content/10 rounded-xl p-4 mt-2 focus:outline-none focus:border-secondary transition-colors"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn btn-ghost hover:bg-base-content/5 text-base-content/70"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!modalInput || isSyncing}
                                                className="btn bg-secondary hover:bg-secondary/80 text-white border-none px-6 disabled:opacity-50"
                                            >
                                                {isSyncing ?
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                :   "Enable Sync"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {modalType === "SETTINGS" && (
                                    <form onSubmit={handleModalSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-bold text-base-content/50 uppercase">Work (min)</label>
                                                <input
                                                    type="number"
                                                    value={settingsForm.work}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, work: Number(e.target.value) })}
                                                    className="w-full bg-base-300/40 text-base-content border border-base-content/10 rounded-xl p-3 mt-1 focus:border-base-content/40 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-base-content/50 uppercase">Short Break</label>
                                                <input
                                                    type="number"
                                                    value={settingsForm.shortBreak}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, shortBreak: Number(e.target.value) })}
                                                    className="w-full bg-base-300/40 text-base-content border border-base-content/10 rounded-xl p-3 mt-1 focus:border-base-content/40 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-base-content/50 uppercase">Long Break</label>
                                                <input
                                                    type="number"
                                                    value={settingsForm.longBreak}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, longBreak: Number(e.target.value) })}
                                                    className="w-full bg-base-300/40 text-base-content border border-base-content/10 rounded-xl p-3 mt-1 focus:border-base-content/40 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-base-content/50 uppercase">Interval</label>
                                                <input
                                                    type="number"
                                                    value={settingsForm.interval}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, interval: Number(e.target.value) })}
                                                    className="w-full bg-base-300/40 text-base-content border border-base-content/10 rounded-xl p-3 mt-1 focus:border-base-content/40 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-xs text-base-content/50 mt-2">
                                            Long break triggers after every {settingsForm.interval} work sessions.
                                        </div>

                                        {/* Sound Selection */}
                                        <div className="pt-4 border-t border-base-content/5">
                                            <label className="text-sm font-bold text-base-content/50 uppercase block mb-2">Alarm Sound</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>).map((soundKey) => (
                                                    <button
                                                        key={soundKey}
                                                        type="button"
                                                        onClick={() => {
                                                            const audio = new Audio(SOUNDS[soundKey]);
                                                            audio.play().catch(() => {});
                                                            setSettingsForm({ ...settingsForm, sound: soundKey });
                                                        }}
                                                        className={clsx(
                                                            "p-3 rounded-xl border text-sm font-medium capitalize transition-all",
                                                            settingsForm.sound === soundKey ?
                                                                "bg-primary text-primary-content border-primary"
                                                            :   "bg-base-300/40 text-base-content/70 border-base-content/10 hover:bg-base-content/5 hover:text-base-content/80",
                                                        )}
                                                    >
                                                        {soundKey}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Sync & Data */}
                                        <div className="pt-4 border-t border-base-content/5">
                                            <label className="text-sm font-bold text-base-content/50 uppercase block mb-2">Data & Sync</label>
                                            <div className="flex flex-col gap-3">
                                                {!syncKey ?
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModalType("SYNC");
                                                            setModalInput(""); // Clear input for password
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-secondary to-secondary/70 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-secondary/20"
                                                    >
                                                        {syncSalt ?
                                                            <>
                                                                <Lock size={18} />
                                                                Unlock Sync
                                                            </>
                                                        :   <>
                                                                <Cloud size={18} />
                                                                Enable Secure Sync
                                                            </>
                                                        }
                                                    </button>
                                                :   <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20 text-success">
                                                        <div className="flex items-center gap-2">
                                                            <Check size={16} />
                                                            <span className="text-sm font-medium">Sync Active</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {lastSyncTime && (
                                                                <span className="text-xs opacity-70">
                                                                    {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    // Merge-safe forced pull with the key already in memory
                                                                    if (!syncKey || !syncSalt) return;
                                                                    setIsSyncing(true);
                                                                    await pullSync(syncKey, syncSalt, true);
                                                                    setIsSyncing(false);
                                                                    toast.success("Pulled latest data");
                                                                }}
                                                                title="Pull latest from server"
                                                                className="p-1 hover:bg-success/20 rounded-full transition-colors"
                                                            >
                                                                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                }

                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={exportData}
                                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-base-300/40 border border-base-content/10 text-base-content/70 hover:bg-base-content/5 hover:text-base-content/80 transition-colors"
                                                    >
                                                        <Download size={16} />
                                                        Export
                                                    </button>
                                                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl bg-base-300/40 border border-base-content/10 text-base-content/70 hover:bg-base-content/5 hover:text-base-content/80 transition-colors">
                                                        <Upload size={16} />
                                                        Import
                                                        <input type="file" accept=".json" onChange={importData} className="hidden" />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn btn-ghost hover:bg-base-content/5 text-base-content/70"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn bg-primary hover:bg-primary/90 text-primary-content border-none px-6">
                                                Save Settings
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {modalType === "SHORTCUTS" && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">Space</kbd>
                                                <span className="text-sm text-base-content/70">Toggle Timer</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">N</kbd>
                                                <span className="text-sm text-base-content/70">New Task</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">Esc</kbd>
                                                <span className="text-sm text-base-content/70">Close / Exit Zen</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">?</kbd>
                                                <span className="text-sm text-base-content/70">Shortcuts</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">/</kbd>
                                                <span className="text-sm text-base-content/70">Search Tasks</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">T</kbd>
                                                <span className="text-sm text-base-content/70">Today View</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <div className="flex gap-1 mb-2">
                                                    <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10">[</kbd>
                                                    <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10">]</kbd>
                                                </div>
                                                <span className="text-sm text-base-content/70">Prev / Next List</span>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5 flex flex-col items-center text-center">
                                                <kbd className="kbd kbd-lg bg-base-300 text-base-content border-base-content/10 mb-2">⌘K</kbd>
                                                <span className="text-sm text-base-content/70">Command Palette</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modalType === "STATS" && (
                                    <div className="space-y-6">
                                        {/* Daily Summary Section (Now at Top) */}
                                        <div className="p-6 bg-base-content/5 rounded-2xl border border-base-content/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-bold text-base-content/80">Daily Summary</h4>
                                                {!aiResult && (
                                                    <button
                                                        onClick={() => {
                                                            setAiLoading(true);
                                                            setAiResult("");
                                                            const today = new Date().toISOString().split("T")[0];
                                                            const todayStats = focusHistory.find((h) => h.date === today);
                                                            const minutes = todayStats?.minutes || 0;

                                                            generateSummary(completedTasks, minutes)
                                                                .then((res) => setAiResult(res))
                                                                .catch(() => toast.error("Failed to generate summary"))
                                                                .finally(() => setAiLoading(false));
                                                        }}
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
                                                    <span className="loading loading-spinner text-success"></span>
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

                                            {!aiLoading && !aiResult && (
                                                <div className="text-sm text-base-content/50 text-center py-4 italic">
                                                    Generate a summary of your achievements today.
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5">
                                                <div className="text-xs text-base-content/50 uppercase font-bold truncate">Focus Today</div>
                                                <div className="text-2xl md:text-3xl font-extrabold text-base-content">
                                                    {focusHistory.find((h) => h.date === new Date().toISOString().split("T")[0])?.minutes || 0}
                                                    <span className="text-sm text-base-content/50 font-normal ml-1">min</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5">
                                                <div className="text-xs text-base-content/50 uppercase font-bold truncate">Tasks Finished</div>
                                                <div className="text-2xl md:text-3xl font-extrabold text-base-content">
                                                    {focusHistory.find((h) => h.date === new Date().toISOString().split("T")[0])?.tasksCompleted || 0}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-base-content/5 rounded-xl border border-base-content/5">
                                                <div className="text-xs text-base-content/50 uppercase font-bold truncate">Total Sessions</div>
                                                <div className="text-2xl md:text-3xl font-extrabold text-base-content">{sessionsCompleted}</div>
                                            </div>
                                        </div>

                                        <StatsExtras tasks={tasks} lists={lists} />

                                        <div className="p-6 bg-base-content/5 rounded-2xl border border-base-content/5">
                                            <h4 className="text-lg font-bold text-base-content/80 mb-6">Last 7 Days</h4>
                                            <div className="flex items-end justify-between h-48 gap-2">
                                                {Array.from({ length: 7 }).map((_, i) => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() - (6 - i));
                                                    const dateStr = d.toISOString().split("T")[0];
                                                    const entry = focusHistory.find((h) => h.date === dateStr);
                                                    const minutes = entry ? entry.minutes : 0;
                                                    const maxMin = Math.max(...focusHistory.map((h) => h.minutes), 60); // Scale based on max or at least 60m
                                                    const height = Math.max((minutes / maxMin) * 100, 4); // Min 4% height

                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                                                            <div className="relative w-full flex items-end justify-center">
                                                                <div
                                                                    className="w-full bg-base-300/50 hover:bg-primary/90 transition-all rounded-md"
                                                                    style={{ height: `${height}%` }}
                                                                />
                                                                <div className="absolute -top-8 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                                    {minutes} min
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-base-content/50 mt-3 font-mono">
                                                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Heatmap Calendar */}
                                        <div className="p-6 bg-base-content/5 rounded-2xl border border-base-content/5">
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
                                                    const dateStr = d.toISOString().split("T")[0];
                                                    const entry = focusHistory.find((h) => h.date === dateStr);
                                                    const minutes = entry ? entry.minutes : 0;
                                                    const tasks = entry?.tasksCompleted || 0;

                                                    // Color intensity based on activity
                                                    let bgColor = "bg-base-300/50";
                                                    if (minutes > 0 || tasks > 0) {
                                                        const intensity = Math.min(minutes / 60, 1); // Cap at 1 hour for max intensity
                                                        if (intensity > 0.7) bgColor = "bg-success";
                                                        else if (intensity > 0.4) bgColor = "bg-success/70";
                                                        else if (intensity > 0.1) bgColor = "bg-success/45";
                                                        else bgColor = "bg-success/20";
                                                    }

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`aspect-square rounded-sm ${bgColor} hover:ring-2 hover:ring-base-content/40 transition-all cursor-default group relative`}
                                                            title={`${d.toLocaleDateString()}: ${minutes}min, ${tasks} tasks`}
                                                        >
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {minutes}m,{" "}
                                                                {tasks} tasks
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-end gap-2 mt-3 text-xs text-base-content/50">
                                                <span>Less</span>
                                                <div className="flex gap-1">
                                                    <div className="w-3 h-3 rounded-sm bg-base-300/50" />
                                                    <div className="w-3 h-3 rounded-sm bg-success/20" />
                                                    <div className="w-3 h-3 rounded-sm bg-success/45" />
                                                    <div className="w-3 h-3 rounded-sm bg-success/70" />
                                                    <div className="w-3 h-3 rounded-sm bg-success" />
                                                </div>
                                                <span>More</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modalType === "NEW_LIST" && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (modalInput.trim()) {
                                                const newId = Date.now().toString(36);
                                                setLists([...lists, { id: newId, name: modalInput.trim() }]);
                                                setActiveListId(newId);
                                                setModalOpen(false);
                                                toast.success(`Created "${modalInput.trim()}"`);
                                            }
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={modalInput}
                                            onChange={(e) => setModalInput(e.target.value)}
                                            placeholder="e.g., Work, Personal, Side Project..."
                                            className="w-full bg-base-300/40 text-lg text-base-content border border-base-content/10 rounded-xl p-4 focus:outline-none focus:border-base-content/40 transition-colors"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn btn-ghost hover:bg-base-content/5 text-base-content/70"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn bg-primary hover:bg-primary/90 text-primary-content border-none px-6">
                                                Create List
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Video Player */}
            <AnimatePresence>
                {showYouTubePlayer && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-50 bg-base-200 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-2 bg-base-300/50">
                            <span className="text-sm font-bold text-base-content/80">{streamType === "youtube" ? "YouTube" : "Twitch"}</span>
                            <button onClick={() => setShowYouTubePlayer(false)} className="text-base-content/50 hover:text-base-content">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="w-[320px] h-[180px] bg-black">
                            {streamType === "youtube" ?
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${customStreamUrl}?autoplay=1`}
                                    title="LoFi Player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="border-none"
                                />
                            :   <iframe
                                    src={`https://player.twitch.tv/?channel=${customStreamUrl}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`}
                                    height="100%"
                                    width="100%"
                                    allowFullScreen
                                    className="border-none"
                                />
                            }
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
