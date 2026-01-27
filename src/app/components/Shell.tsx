"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import NavBar from "./Navbar";
import { usePathname } from "next/navigation";

export default function Shell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Check local storage
        const saved = localStorage.getItem("sidebar-state");
        if (saved !== null) {
            setIsSidebarOpen(JSON.parse(saved));
        } else {
            // Default to OPEN on desktop, CLOSED on mobile
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebar-state", JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    useEffect(() => {
        // Close mobile nav on route change
        setIsMobileNavOpen(false);
    }, [pathname]);

    useEffect(() => {
        // Prevent background scrolling while mobile drawer is open
        if (!isMobileNavOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileNavOpen]);

    if (!isLoaded) return <div className="h-screen bg-zinc-950" />;

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-primary/30">
            {/* Sidebar Container */}
            <motion.div
                initial={{ width: 320 }}
                animate={{ width: isSidebarOpen ? 320 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden md:flex relative h-full border-r border-white/5 bg-zinc-950 shadow-2xl overflow-hidden flex-shrink-0"
            >
                <div className="h-full w-[320px] overflow-y-auto bg-black/20">
                    <NavBar />
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Nav Toggle */}
                <button
                    onClick={() => setIsMobileNavOpen((v) => !v)}
                    className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-full bg-zinc-900/90 backdrop-blur border border-white/10 shadow-xl active:scale-95 transition-transform"
                    aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={isMobileNavOpen}
                >
                    {isMobileNavOpen ?
                        <X size={20} />
                    :   <Menu size={20} />}
                </button>

                <AnimatePresence>
                    {isMobileNavOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.button
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="md:hidden fixed inset-0 z-50 bg-black/60"
                                aria-label="Close navigation menu"
                                onClick={() => setIsMobileNavOpen(false)}
                            />

                            {/* Drawer */}
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", stiffness: 320, damping: 35 }}
                                className="md:hidden fixed inset-y-0 left-0 z-[55] w-[320px] max-w-[85vw] border-r border-white/10 bg-zinc-950 shadow-2xl overflow-hidden"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Navigation menu"
                            >
                                <div className="h-full overflow-y-auto bg-black/20">
                                    <NavBar />
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Toggle Button (Floating) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden md:block absolute top-4 left-4 z-50 p-2 rounded-full bg-base-100 shadow-lg hover:bg-base-200 transition-colors border border-base-content/10"
                    aria-label="Toggle Sidebar"
                >
                    {isSidebarOpen ?
                        <X size={20} />
                    :   <Menu size={20} />}
                </button>

                <main className="flex-1 overflow-y-auto w-full">{children}</main>
            </div>
        </div>
    );
}
