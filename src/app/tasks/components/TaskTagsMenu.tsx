"use client";

import { useMemo } from "react";
import clsx from "clsx";
import AnchorPopover from "./AnchorPopover";
import type { TaskTag } from "../types";

export type { TaskTag };

type Props = {
    open: boolean;
    anchorEl: HTMLElement | null;
    tags: TaskTag[];
    selectedTagIds: string[];
    onToggleTag: (tagId: string) => void;
    onClose: () => void;
};

export default function TaskTagsMenu({ open, anchorEl, tags, selectedTagIds, onToggleTag, onClose }: Props) {
    const selected = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

    return (
        <AnchorPopover open={open} anchorEl={anchorEl} onClose={onClose} width={180} dismissOnMouseLeave>
            <div className="space-y-1" role="menu" aria-label="Task tags">
                {tags.map((tag) => {
                    const isSelected = selected.has(tag.id);
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => onToggleTag(tag.id)}
                            className={clsx(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left",
                                isSelected ? `${tag.color} text-white` : "text-base-content/70 hover:bg-base-content/5 hover:text-base-content",
                            )}
                            role="menuitemcheckbox"
                            aria-checked={isSelected}
                        >
                            <span className={clsx("w-2 h-2 rounded-full flex-shrink-0", tag.color)} />
                            {tag.label}
                        </button>
                    );
                })}
            </div>
        </AnchorPopover>
    );
}
