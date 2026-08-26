"use client";

/**
 * Discoverability affordance for the command palette — clickable (works on
 * touch) and advertises the ⌘K shortcut. Dispatches the same event the palette
 * listens for. Hidden below md, where there is no keyboard to speak of.
 */
export default function CommandHint() {
    return (
        <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-base-content/10 bg-base-content/5 hover:bg-base-content/10 hover:border-base-content/20 text-base-content/50 hover:text-base-content/80 transition-colors text-sm"
            aria-label="Open command palette"
        >
            <span className="font-mono">$</span>
            <kbd className="text-[10px] font-mono border border-base-content/20 rounded px-1.5 py-0.5">
                ⌘K
            </kbd>
        </button>
    );
}
