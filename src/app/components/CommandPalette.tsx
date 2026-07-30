"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Home,
    Briefcase,
    TerminalSquare,
    BookOpen,
    CheckSquare,
    FileText,
    Mail,
    Plus,
    SunMoon,
    CornerDownLeft,
    Search,
} from "lucide-react";
// Brand glyphs — lucide 1.x dropped these; react-icons is already the source.
import { FaGithub, FaLinkedin } from "react-icons/fa";

/**
 * Site-wide ⌘K / Ctrl-K command palette. Keyboard-first navigation that speaks
 * the site's terminal dialect (go, open, run). Hand-rolled — no cmdk dependency,
 * consistent with the from-scratch shell.
 */

type Command = {
    id: string;
    label: string;
    hint: string;
    keywords: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    run: (ctx: { router: ReturnType<typeof useRouter> }) => void;
};

function toggleTheme() {
    const el = document.documentElement;
    const next = el.getAttribute("data-theme") === "daylight" ? "midnight" : "daylight";
    el.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
}

const go = (path: string) => ({ router }: { router: ReturnType<typeof useRouter> }) =>
    router.push(path);
const open = (url: string) => () => window.open(url, "_blank", "noopener,noreferrer");

const COMMANDS: Command[] = [
    { id: "home", label: "Go home", hint: "/", keywords: "home index start", icon: Home, run: go("/") },
    { id: "projects", label: "Go to Projects", hint: "/projects", keywords: "work repos github lcsr", icon: Briefcase, run: go("/projects") },
    { id: "playground", label: "Open the Playground", hint: "/playground", keywords: "run webcontainer node terminal repl demo", icon: TerminalSquare, run: go("/playground") },
    { id: "blog", label: "Read the Blog", hint: "/blog", keywords: "writing posts articles security", icon: BookOpen, run: go("/blog") },
    { id: "cv", label: "Open the CV (shell)", hint: "/cv", keywords: "resume cv terminal shell easter egg", icon: FileText, run: go("/cv") },
    { id: "tasks", label: "Go to Tasks", hint: "/tasks", keywords: "tasks todo workflow today pomodoro focus", icon: CheckSquare, run: go("/tasks") },
    { id: "theme", label: "Toggle light / dark", hint: "midnight ⇄ daylight", keywords: "theme dark light mode color", icon: SunMoon, run: toggleTheme },
    { id: "github", label: "Open GitHub", hint: "github.com/mkhawam", keywords: "github code source open", icon: FaGithub, run: open("https://github.com/mkhawam") },
    { id: "linkedin", label: "Open LinkedIn", hint: "linkedin.com/in/mohamad-k", keywords: "linkedin contact", icon: FaLinkedin, run: open("https://linkedin.com/in/mohamad-k") },
    { id: "email", label: "Send an email", hint: "khawammohamad99@gmail.com", keywords: "email contact mail reach", icon: Mail, run: open("mailto:khawammohamad99@gmail.com") },
];

export default function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const activeItemRef = useRef<HTMLButtonElement | null>(null);

    const results = useMemo(() => {
        const raw = query.trim();

        // Quick capture: task text becomes /tasks?add=… and flows through the
        // quick-add parser there, so "#tag !high @fri" tokens work from anywhere.
        // encodeURIComponent is mandatory — a bare "#work" would become a URL fragment.
        const makeAddCommand = (text: string): Command => ({
            id: "add-task",
            label: `Add task: "${text}"`,
            hint: "supports #tag !high @fri",
            keywords: "",
            icon: Plus,
            run: ({ router }) => router.push(`/tasks?add=${encodeURIComponent(text)}`),
        });

        // "+" prefix = explicit capture, palette shows only the add command
        if (raw.startsWith("+")) {
            const text = raw.slice(1).trim();
            return text ? [makeAddCommand(text)] : [];
        }

        const q = raw.toLowerCase();
        if (!q) return COMMANDS;
        const matches = COMMANDS.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.keywords.includes(q) ||
                c.hint.toLowerCase().includes(q),
        );
        // No match → the query is probably a task; always offer capture as the last row
        return matches.length === 0 ? [makeAddCommand(raw)] : [...matches, makeAddCommand(raw)];
    }, [query]);

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
        setActive(0);
    }, []);

    const runCommand = useCallback(
        (cmd: Command | undefined) => {
            if (!cmd) return;
            close();
            cmd.run({ router });
        },
        [close, router],
    );

    // Global ⌘K / Ctrl-K to open; Esc handled while open. A custom event lets a
    // clickable hint (useful on touch devices) open it without a keyboard.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        const onOpen = () => setOpen(true);
        window.addEventListener("keydown", onKey);
        window.addEventListener("open-command-palette", onOpen);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("open-command-palette", onOpen);
        };
    }, []);

    useEffect(() => {
        if (open) {
            setActive(0);
            // focus after paint
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        setActive(0);
    }, [query]);

    // Keep the highlighted row visible as arrow keys move (or wrap) past the
    // edges of the scroll viewport.
    useEffect(() => {
        activeItemRef.current?.scrollIntoView({ block: "nearest" });
    }, [active]);

    if (!open) return null;

    const onListKey = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            close();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            // Wrap around at the ends.
            setActive((i) => (results.length ? (i + 1) % results.length : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            runCommand(results[active]);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
            <button
                type="button"
                aria-label="Close command palette"
                onClick={close}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="relative w-full max-w-lg rounded-2xl border border-base-content/15 bg-base-200 shadow-2xl overflow-hidden"
            >
                <div className="flex items-center gap-3 px-4 border-b border-base-content/10">
                    <Search size={16} className="text-base-content/40" aria-hidden />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onListKey}
                        placeholder="Type a command or search…"
                        aria-label="Command"
                        className="flex-1 bg-transparent py-4 text-base-content placeholder:text-base-content/40 focus:outline-none"
                    />
                    <kbd className="hidden sm:block text-[10px] font-mono text-base-content/40 border border-base-content/20 rounded px-1.5 py-0.5">
                        esc
                    </kbd>
                </div>

                <ul className="max-h-80 overflow-y-auto p-2">
                    {results.length === 0 && (
                        <li className="px-3 py-6 text-center text-sm text-base-content/40">
                            No matches
                        </li>
                    )}
                    {results.map((cmd, i) => {
                        const Icon = cmd.icon;
                        const isActive = i === active;
                        return (
                            <li key={cmd.id}>
                                <button
                                    type="button"
                                    ref={isActive ? activeItemRef : null}
                                    onMouseMove={() => setActive(i)}
                                    onClick={() => runCommand(cmd)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                        isActive ? "bg-base-content/10" : "hover:bg-base-content/5"
                                    }`}
                                >
                                    <Icon
                                        size={16}
                                        className={isActive ? "text-primary" : "text-base-content/50"}
                                    />
                                    <span className="text-sm text-base-content">{cmd.label}</span>
                                    <span className="ml-auto text-xs font-mono text-base-content/40">
                                        {cmd.hint}
                                    </span>
                                    {isActive && (
                                        <CornerDownLeft
                                            size={13}
                                            className="text-base-content/40"
                                            aria-hidden
                                        />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
