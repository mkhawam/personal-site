"use client";

import { useState } from "react";
import clsx from "clsx";
import { Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Props = {
    content: string;
    onChange: (content: string) => void;
    variant: "desktop" | "mobile";
};

// Edit/preview toggle for the Notes tab — the placeholder has claimed
// "Markdown supported" for a while; preview mode finally makes it true.
export default function NoteEditor({ content, onChange, variant }: Props) {
    const [preview, setPreview] = useState(false);

    return (
        <div className="flex-1 flex flex-col min-h-0 relative">
            <button
                onClick={() => setPreview(!preview)}
                className={clsx(
                    "absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    preview ? "bg-primary/10 text-primary" : "bg-base-content/5 text-base-content/50 hover:text-base-content/80",
                )}
                title={preview ? "Back to editing" : "Preview markdown"}
            >
                {preview ?
                    <>
                        <Pencil size={12} /> Edit
                    </>
                :   <>
                        <Eye size={12} /> Preview
                    </>
                }
            </button>

            {preview ?
                <div
                    className={clsx(
                        "flex-1 overflow-y-auto prose prose-sm max-w-none text-base-content/80",
                        variant === "desktop" ? "p-4" : "p-2 text-lg",
                    )}
                >
                    <ReactMarkdown>{content || "*Nothing here yet*"}</ReactMarkdown>
                </div>
            :   <textarea
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={variant === "desktop" ? "Write your notes here... (Markdown supported)" : "Type your notes... (Markdown supported)"}
                    className={clsx(
                        "flex-1 w-full bg-transparent text-base-content/80 focus:outline-none resize-none",
                        variant === "desktop" ? "p-4 font-mono text-sm leading-relaxed" : "p-2 text-lg leading-relaxed",
                    )}
                />
            }
        </div>
    );
}
