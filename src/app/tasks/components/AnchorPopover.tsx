"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
    open: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    width?: number;
    maxHeight?: number;
    /** Close when the cursor wanders far from anchor/popover. Opt-in only —
     * it fights popovers containing inputs (date pickers, steppers). */
    dismissOnMouseLeave?: boolean;
    children: React.ReactNode;
};

type Position = { top: number; left: number; maxHeight: number; width: number };

/**
 * Portal-based anchored popover: viewport-aware placement (below/above),
 * outside-click + Escape dismissal. Extracted from TaskTagsMenu so due-date,
 * move-to-list, and estimate editors can share the machinery.
 */
export default function AnchorPopover({ open, anchorEl, onClose, width = 180, maxHeight = 256, dismissOnMouseLeave = false, children }: Props) {
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<Position | null>(null);

    useLayoutEffect(() => {
        // Keep the last known position when closing so exit animations don't jump.
        if (!open || !anchorEl) return;

        const margin = 8;

        const update = () => {
            const rect = anchorEl.getBoundingClientRect();

            // Place menu below if there's space; otherwise above.
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const placeBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;

            const fittedMaxHeight = Math.max(160, Math.min(maxHeight, (placeBelow ? spaceBelow : spaceAbove) - margin * 2));

            // Align menu to the right edge of the anchor by default.
            let left = rect.right - width;
            left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

            let top = placeBelow ? rect.bottom + margin : rect.top - margin - fittedMaxHeight;
            top = Math.max(margin, Math.min(top, window.innerHeight - fittedMaxHeight - margin));

            setPos({ top, left, maxHeight: fittedMaxHeight, width });
        };

        update();
        window.addEventListener("resize", update);
        // capture scroll from scroll containers too
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, anchorEl, width, maxHeight]);

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
        if (!open || !dismissOnMouseLeave) return;

        // Close the menu if the cursor moves "too far" from the anchor/menu.
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
            const a = anchorEl?.getBoundingClientRect();
            const m = menuRef.current?.getBoundingClientRect();
            if (!a || !m) return;

            const inside = pointInRect(e.clientX, e.clientY, a, buffer) || pointInRect(e.clientX, e.clientY, m, buffer);

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
    }, [open, anchorEl, onClose, dismissOnMouseLeave]);

    // We render a portal container whenever we have a position to render from.
    // AnimatePresence will handle the exit animation even after open becomes false.
    if (!pos) return null;

    return createPortal(
        <AnimatePresence>
            {open && anchorEl && (
                <motion.div
                    ref={menuRef}
                    style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                    className="z-[1000] bg-base-200 border border-base-content/10 rounded-xl shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                >
                    <div className="p-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: pos.maxHeight }}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
