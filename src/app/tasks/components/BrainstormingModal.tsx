"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, Paperclip, Globe, X, ArrowUpCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { chatWithAI, type ChatMessage } from "@/lib/ai";

type BrainstormTask = {
    id: string;
    text: string;
    subtasks?: string[];
    selected: boolean;
};

type BrainstormChatMessage = ChatMessage & {
    tasks?: BrainstormTask[];
};

type BrainstormingModalProps = {
    onAddTask: (text: string, subtasks: string[]) => void;
    onClose: () => void;
};

export default function BrainstormingModal({ onAddTask, onClose }: BrainstormingModalProps) {
    // --- State ---
    const [chatMessages, setChatMessages] = useState<BrainstormChatMessage[]>([]);
    const [modalInput, setModalInput] = useState("");
    const [contextFile, setContextFile] = useState<{ name: string; content: string } | null>(null);
    const [contextUrl, setContextUrl] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isChatTyping, setIsChatTyping] = useState(false);
    const [activeBrainstormTab, setActiveBrainstormTab] = useState<"chat" | "plan">("chat");

    // --- Refs ---
    const modalInputRef = useRef<HTMLTextAreaElement>(null); // Changed to specific type
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isChatTyping]);

    // Focus input on mount
    useEffect(() => {
        // Small timeout to ensure modal is fully rendered
        setTimeout(() => {
            modalInputRef.current?.focus();
        }, 100);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!modalInput.trim() && !contextFile) || isChatTyping) return;

        let userText = modalInput.trim();

        // Prepend Context
        let contextMsg = "";
        if (contextFile) {
            contextMsg += `\n\n[CONTEXT FILE: ${contextFile.name}]\n${contextFile.content}\n\n`;
        }

        // Inject URL context if present
        if (contextUrl.trim()) {
            if (!userText.includes(contextUrl)) {
                userText += `\n\n(Context URL: ${contextUrl})`;
            }
        }

        const finalContent = (contextMsg + userText).trim();

        const newHistory: BrainstormChatMessage[] = [...chatMessages, { role: "user", content: finalContent }];
        setChatMessages(newHistory);
        setModalInput("");
        setContextFile(null);
        setContextUrl("");
        setShowUrlInput(false);
        setIsChatTyping(true);

        // Reset textarea height
        if (modalInputRef.current) {
            modalInputRef.current.style.height = "48px";
        }

        // Scroll handled by effect, but specific submission scroll can stay if needed
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

        chatWithAI(newHistory)
            .then((response) => {
                const assistantMsg: BrainstormChatMessage = { role: "assistant", content: response.text };
                if (response.tasks) {
                    assistantMsg.tasks = response.tasks.map((t) => ({
                        id: Math.random().toString(36),
                        text: t.text,
                        subtasks: t.subtasks,
                        selected: true,
                    }));
                }
                setChatMessages([...newHistory, assistantMsg]);
            })
            .catch(() => toast.error("Failed to get response"))
            .finally(() => {
                setIsChatTyping(false);
            });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden -mx-6 -mb-6 md:flex-row">
            {/* Mobile Tabs */}
            <div className="flex md:hidden border-b border-base-content/5 bg-base-300/40">
                <button
                    onClick={() => setActiveBrainstormTab("chat")}
                    className={clsx(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeBrainstormTab === "chat" ? "border-success text-success bg-success/5" : "border-transparent text-base-content/50",
                    )}
                >
                    Chat
                </button>
                <button
                    onClick={() => setActiveBrainstormTab("plan")}
                    className={clsx(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeBrainstormTab === "plan" ? "border-success text-success bg-success/5" : "border-transparent text-base-content/50",
                    )}
                >
                    Tasks & Plan
                </button>
            </div>

            {/* Left Column: Chat */}
            <div
                className={clsx(
                    "flex-1 flex flex-col border-r border-base-content/5 bg-base-300/20 p-6 min-w-0 h-full",
                    activeBrainstormTab === "chat" ? "flex" : "hidden md:flex",
                )}
            >
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
                    <div className="flex-1" /> {/* Spacer to push messages down */}
                    <div className="flex flex-col space-y-4 pb-2">
                        {chatMessages.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-base-content/30">
                                <p className="text-sm">Start brainstorming...</p>
                            </div>
                        )}
                        {chatMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={clsx(
                                    "flex flex-col max-w-[90%] md:max-w-[75%]",
                                    msg.role === "user" ? "self-end items-end" : "self-start items-start",
                                )}
                            >
                                <div
                                    className={clsx(
                                        "p-4 rounded-2xl text-base leading-relaxed break-words prose prose-sm max-w-none",
                                        msg.role === "user" ?
                                            "bg-primary/80 text-primary-content rounded-br-sm prose-p:text-primary-content"
                                        :   "bg-base-content/5 border border-base-content/5 text-base-content/80 rounded-bl-sm",
                                    )}
                                >
                                    <ReactMarkdown
                                        components={{
                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                const match = /language-(\w+)/.exec(className || "");
                                                return !inline ?
                                                        <div className="relative group/code my-2 max-w-full">
                                                            <code
                                                                className={clsx(
                                                                    "block bg-base-300/50 p-3 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap md:whitespace-pre",
                                                                    className,
                                                                )}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </code>
                                                        </div>
                                                    :   <code className="bg-base-300/50 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                                            {children}
                                                        </code>;
                                            },
                                            ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                                            li: ({ children }) => <li className="marker:text-base-content/50">{children}</li>,
                                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                            a: ({ href, children }) => (
                                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
                                                    {children}
                                                </a>
                                            ),
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isChatTyping && (
                            <div className="self-start flex items-center gap-2 p-3 bg-base-content/5 rounded-2xl rounded-bl-sm w-16">
                                <div className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-4 flex flex-col gap-2 bg-base-300/50 border border-base-content/10 rounded-3xl p-2 focus-within:border-base-content/30 focus-within:bg-base-300 transition-all shadow-inner relative"
                >
                    {/* Context Pills */}
                    {(contextFile || contextUrl) && (
                        <div className="flex gap-2 px-3 pt-2">
                            {contextFile && (
                                <div className="flex items-center gap-1 text-xs bg-base-content/10 text-base-content/80 px-2 py-1 rounded-full">
                                    <FileText size={12} />
                                    <span className="max-w-[150px] truncate">{contextFile.name}</span>
                                    <button type="button" onClick={() => setContextFile(null)} className="hover:text-error ml-1">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            {contextUrl && (
                                <div className="flex items-center gap-1 text-xs bg-info/10 text-info/80 px-2 py-1 rounded-full border border-info/20">
                                    <Globe size={12} />
                                    <span className="max-w-[150px] truncate">{contextUrl}</span>
                                    <button type="button" onClick={() => setContextUrl("")} className="hover:text-error ml-1">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* URL Input Bar */}
                    {showUrlInput && (
                        <div className="px-3 flex gap-2 items-center animate-in slide-in-from-bottom-2 fade-in">
                            <Globe size={14} className="text-base-content/50" />
                            <input
                                type="url"
                                value={contextUrl}
                                onChange={(e) => setContextUrl(e.target.value)}
                                placeholder="Paste URL (e.g. github repo, documentation)..."
                                className="flex-1 bg-transparent text-sm text-base-content/80 focus:outline-none placeholder:text-base-content/50"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        setShowUrlInput(false);
                                    }
                                }}
                                autoFocus
                            />
                            <button type="button" onClick={() => setShowUrlInput(false)} className="text-base-content/50 hover:text-base-content/80">
                                <Check size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        {/* Attachment Buttons */}
                        <div className="flex pb-2 pl-2 gap-1">
                            <label
                                className="p-2 hover:bg-base-content/10 rounded-full text-base-content/50 hover:text-base-content/80 cursor-pointer transition-colors"
                                title="Attach File"
                            >
                                <Paperclip size={18} />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".txt,.md,.json,.js,.ts,.tsx,.css,.html"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                setContextFile({
                                                    name: file.name,
                                                    content: ev.target?.result as string,
                                                });
                                            };
                                            reader.readAsText(file);
                                        }
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className={clsx(
                                    "p-2 rounded-full transition-colors",
                                    showUrlInput || contextUrl ? "text-info bg-info/10" : (
                                        "text-base-content/50 hover:text-base-content/80 hover:bg-base-content/10"
                                    ),
                                )}
                                title="Add URL Context"
                            >
                                <Globe size={18} />
                            </button>
                        </div>

                        <textarea
                            ref={modalInputRef}
                            value={modalInput}
                            onChange={(e) => {
                                setModalInput(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    // requestSubmit() is the standard way to submit programmatically from outside a button click if needed
                                    // but here we are in a form
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }}
                            placeholder={contextFile || contextUrl ? "Ask about this context..." : "Message AI Assistant..."}
                            className="flex-1 bg-transparent text-base text-base-content/80 px-3 py-3 focus:outline-none placeholder:text-base-content/50 resize-none custom-scrollbar"
                            rows={1}
                            style={{ minHeight: "48px", maxHeight: "150px" }}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={(!modalInput.trim() && !contextFile) || isChatTyping}
                            className={clsx(
                                "btn btn-circle btn-sm border-none transition-all mb-2 mr-2",
                                (!modalInput.trim() && !contextFile) || isChatTyping ?
                                    "bg-base-300 text-base-content/50"
                                :   "bg-primary text-primary-content hover:bg-primary/90 hover:scale-105",
                            )}
                        >
                            <ArrowUpCircle size={20} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Column: Latest Tasks & Actions */}
            <div
                className={clsx(
                    "w-full md:w-[340px] md:shrink-0 flex flex-col bg-base-300/40 border-l border-base-content/5",
                    activeBrainstormTab === "plan" ? "flex" : "hidden md:flex",
                )}
            >
                {/* Find the latest message that HAS tasks */}
                {(() => {
                    const latestTaskMsgIndex = [...chatMessages].reverse().findIndex((m) => m.tasks && m.tasks.length > 0);
                    const realIndex = latestTaskMsgIndex >= 0 ? chatMessages.length - 1 - latestTaskMsgIndex : -1;
                    const latestMsgWithTasks = realIndex >= 0 ? chatMessages[realIndex] : null;

                    if (!latestMsgWithTasks || !latestMsgWithTasks.tasks) {
                        return (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-base-content/50">
                                <Sparkles size={32} className="mb-4 opacity-20" />
                                <p className="text-sm">Describe your goal, and I'll build a plan here.</p>
                            </div>
                        );
                    }

                    return (
                        <>
                            <div className="p-4 border-b border-base-content/5 flex justify-between items-center bg-base-content/5">
                                <span className="text-xs font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    Current Plan
                                </span>
                                <button
                                    onClick={() => {
                                        const toAdd = latestMsgWithTasks.tasks?.filter((t) => t.selected) || [];
                                        toAdd.forEach((t: any) => onAddTask(t.text, (t.subtasks || []) as string[]));
                                        toast.success(`Populated ${toAdd.length} tasks`);
                                        onClose(); // Optional: close modal? Or keep open. The original didn't close explicitly, just let user close?
                                        // Original code: setModalOpen(false) in the handler. Yes it closed.
                                    }}
                                    className="text-xs bg-primary text-primary-content hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors font-bold shadow-lg shadow-base-content/10"
                                >
                                    Add Selected
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {(latestMsgWithTasks.tasks || []).map((task: any) => (
                                    <div
                                        key={task.id}
                                        onClick={() => {
                                            const newMessages = [...chatMessages];
                                            // We know realIndex is valid here
                                            const targetMsg = newMessages[realIndex];
                                            if (targetMsg.tasks) {
                                                targetMsg.tasks = targetMsg.tasks.map((t) =>
                                                    t.id === task.id ? { ...t, selected: !t.selected } : t,
                                                );
                                                setChatMessages(newMessages);
                                            }
                                        }}
                                        className={clsx(
                                            "p-3 rounded-xl border flex flex-col items-start gap-2 cursor-pointer transition-all group",
                                            task.selected ?
                                                "bg-success/5 border-success/20"
                                            :   "bg-transparent border-base-content/5 hover:bg-base-content/5",
                                        )}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            <div
                                                className={clsx(
                                                    "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-all duration-200 shrink-0",
                                                    task.selected ?
                                                        "bg-success border-success text-white shadow-sm"
                                                    :   "border-base-content/25 bg-base-300/40 group-hover:border-base-content/40",
                                                )}
                                            >
                                                {task.selected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <span
                                                className={clsx(
                                                    "text-sm leading-relaxed transition-colors",
                                                    task.selected ? "text-base-content/80" : "text-base-content/50",
                                                )}
                                            >
                                                {task.text}
                                            </span>
                                        </div>

                                        {/* Render Subtasks Preview in Sidebar */}
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="pl-8 w-full space-y-1">
                                                {(task.subtasks || []).map((sub: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-base-content/50">
                                                        <div className="w-1 h-1 rounded-full bg-base-300" />
                                                        <span>{sub}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
