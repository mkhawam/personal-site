'use client';

import { Projects } from "./components/Projects";
import { motion } from "framer-motion";

export default function ProjectsPage() {
    return (
        <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-100 tracking-tight">
                        Projects
                    </h1>
                </motion.div>
                <Projects />
            </div>
        </div>
    );
}
