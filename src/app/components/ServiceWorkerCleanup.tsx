"use client";

import { useEffect } from "react";

/**
 * The site used to register a cache-first service worker; it is gone now, but
 * previously installed clients still carry the registration and its caches.
 * Unregister anything left and drop the `workflow-*` caches it created.
 * Pairs with the kill-switch public/sw.js, which handles clients that only
 * re-check the worker script and never run this component. Remove both once
 * installed clients have had a chance to visit.
 */
export default function ServiceWorkerCleanup() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker
            .getRegistrations()
            .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => false))))
            .catch(() => {});

        if ("caches" in window) {
            caches
                .keys()
                .then((names) => Promise.all(names.filter((n) => n.startsWith("workflow-")).map((n) => caches.delete(n))))
                .catch(() => {});
        }
    }, []);

    return null;
}
