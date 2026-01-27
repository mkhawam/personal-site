"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        // In development, the SW can aggressively cache Next.js assets and make UI changes
        // appear to "not apply". Only register in production.
        if (process.env.NODE_ENV !== "production") {
            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((r) => r.unregister().catch(() => {}));
                });

                // Also clear workflow caches created by our SW.
                if ("caches" in window) {
                    caches.keys().then((names) => {
                        names
                            .filter((n) => n.startsWith("workflow-"))
                            .forEach((n) => {
                                caches.delete(n).catch(() => {});
                            });
                    });
                }
            }
            return;
        }

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });

            // Listen for controller change (new worker activated)
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            // OPTIONAL: You can poll for updates or just wait for the next visit/reload
            // If a waiting worker exists, it means a new version is ready but waiting
            // We are using self.skipWaiting() in sw.js mostly, so it might activate immediately.
            // But adding a specific user-visible "Update" toast is good UX if skipWaiting isn't enough or for major changes.

            // Simple Toast for when a new SW is installed and waiting (if skipWaiting wasn't auto)
            // OR mostly just to inform user "App updated" if we forced a reload.

            // Since sw.js has self.skipWaiting(), the controllerchange event will fire automatically
            // and we force a reload above.
            // If we want to be gentler (ask user), we would remove self.skipWaiting() from sw.js
            // and use the toast to postMessage({ type: 'SKIP_WAITING' }) to the waiting worker.

            // User asked: "How do i force it to update"
            // Answer: Change VERSION in sw.js -> browser downloads new sw.js -> install -> activate (skipWaiting) -> controllerchange -> reload.

            // Let's make it a bit more improved: Show toast BEFORE reloading if possible?
            // Actually with skipWaiting() in sw.js, it happens very fast.
            // Let's implement the toast approach INSTEAD of auto-reload for better UX.
        }
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;

        // Better approach:
        // 1. Remove auto-reload listener above if we want a toast.
        // 2. OR keep auto-reload and just show "Updating..."

        // Given the user wants to "Force it to update", auto-reload on controller change is the most "forced" way.
        // But let's give the user control via a Toast as discussed in the plan.

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                // Check if there's an update found
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            // New update available
                            toast.info("New update available!", {
                                action: {
                                    label: "Reload",
                                    onClick: () => window.location.reload(),
                                },
                                duration: Infinity, // Stay until clicked
                            });
                        }
                    });
                });
            });
        }
    }, []);

    return null;
}
