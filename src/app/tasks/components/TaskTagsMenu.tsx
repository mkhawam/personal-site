"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

export type TaskTag = {
    id: string;
    label: string;
    color: string; // tailwind class e.g. bg-info
};

type Props = {
    open: boolean;
    anchorEl: HTMLElement | null;
    tags: TaskTag[];
    selectedTagIds: string[];
    onToggleTag: (tagId: string) => void;
    onClose: () => void;
};

type Position = { top: number; left: number; maxHeight: number; width: number };

export default function TaskTagsMenu({ open, anchorEl, tags, selectedTagIds, onToggleTag, onClose }: Props) {
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<Position | null>(null);

    const selected = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

    useLayoutEffect(() => {
        // Keep the last known position when closing so exit animations don't jump.
        if (!open || !anchorEl) return;

        const margin = 8;
        const preferredWidth = 180;
        const preferredMaxHeight = 256;

        const update = () => {
            const rect = anchorEl.getBoundingClientRect();

            // Place menu below if there's space; otherwise above.
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const placeBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;

            const maxHeight = Math.max(160, Math.min(preferredMaxHeight, (placeBelow ? spaceBelow : spaceAbove) - margin * 2));

            // Align menu to the right edge of the anchor by default.
            let left = rect.right - preferredWidth;
            left = Math.max(margin, Math.min(left, window.innerWidth - preferredWidth - margin));

            let top = placeBelow ? rect.bottom + margin : rect.top - margin - maxHeight;
            top = Math.max(margin, Math.min(top, window.innerHeight - maxHeight - margin));

            setPos({ top, left, maxHeight, width: preferredWidth });
        };

        update();
        window.addEventListener("resize", update);
        // capture scroll from scroll containers too
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, anchorEl]);

    useEffect(() => {
        if (!open) return;

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (menuRef.current?.contains(target)) return;
            if (anchorEl?.contains(target)) return;
            onClose();
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open, anchorEl, onClose]);

    useEffect(() => {
        if (!open) return;

        // Close the menu if the cursor moves "too far" from the anchor/menu.
        // This keeps the click-to-open UX, but lets the menu dismiss naturally
        // without needing an explicit outside click.
        const buffer = 28; // px padding around anchor/menu
        const dismissDelayMs = 140; // small grace period to avoid flicker

        let dismissTimer: number | null = null;

        const clearTimer = () => {
            if (dismissTimer !== null) {
                window.clearTimeout(dismissTimer);
                dismissTimer = null;
            }
        };

        const pointInRect = (x: number, y: number, r: DOMRect, pad: number) => {
            return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
        };

        const onMouseMove = (e: MouseEvent) => {
            const mx = e.clientX;
            const my = e.clientY;

            const a = anchorEl?.getBoundingClientRect();
            const m = menuRef.current?.getBoundingClientRect();
            if (!a || !m) return;

            const inside = pointInRect(mx, my, a, buffer) || pointInRect(mx, my, m, buffer);

            if (inside) {
                clearTimer();
                return;
            }

            if (dismissTimer === null) {
                dismissTimer = window.setTimeout(() => {
                    dismissTimer = null;
                    onClose();
                }, dismissDelayMs);
            }
        };

        document.addEventListener("mousemove", onMouseMove);
        return () => {
            clearTimer();
            document.removeEventListener("mousemove", onMouseMove);
        };
    }, [open, anchorEl, onClose]);

    // We render a portal container whenever we have a position to render from.
    // AnimatePresence will handle the exit animation even after open becomes false.
    if (!pos) return null;

    return createPortal(
        <AnimatePresence>
            {open && anchorEl && (
                <motion.div
                    ref={menuRef}
                    style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                    className={clsx(
                        // Match other dropdowns in this page (e.g., list dropdown)
                        "z-[1000] bg-base-200 border border-base-content/10 rounded-xl shadow-2xl overflow-hidden",
                    )}
                    role="menu"
                    aria-label="Task tags"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                >
                    <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: pos.maxHeight }}>
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
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
