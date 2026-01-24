'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import NavBar from './Navbar';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-state');
    if (saved !== null) setIsSidebarOpen(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  if (!isLoaded) return <div className="h-screen bg-zinc-950" />;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-primary/30">
      {/* Sidebar Container */}
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: isSidebarOpen ? 320 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative h-full border-r border-white/5 bg-zinc-950 shadow-2xl overflow-hidden flex-shrink-0"
      >
        <div className="h-full w-[320px] overflow-y-auto bg-black/20">
             <NavBar />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Toggle Button (Floating) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-50 p-2 rounded-full bg-base-100 shadow-lg hover:bg-base-200 transition-colors border border-base-content/10"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <main className="flex-1 overflow-y-auto w-full">
            {children}
        </main>
      </div>
    </div>
  );
}
