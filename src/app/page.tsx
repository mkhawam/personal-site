'use client';

import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-12"
      >
        {/* Header Section */}
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-zinc-100 tracking-tight"
          >
            Mohamad Khawam
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-3xl text-zinc-400 font-light"
          >
            Software Development and Deployment
          </motion.h2>
        </div>

        {/* Quote Card - Glassmorphism */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-16 text-center shadow-xl"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full -ml-20 -mb-20" />
            
            <p className="text-2xl md:text-4xl italic font-serif leading-relaxed text-zinc-200 relative z-10">
              &quot;You have light and peace inside of you. If you let it out, you can change the world around you.&quot;
            </p>
            <p className="mt-6 text-zinc-500 font-medium tracking-wide uppercase text-sm relative z-10">
              — Uncle Iroh
            </p>
        </motion.div>

        {/* About Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid md:grid-cols-12 gap-8"
        >
            <div className="md:col-span-4">
               <h3 className="text-3xl font-bold text-zinc-100">About Me</h3>
               <div className="h-1 w-20 bg-zinc-700 mt-2 rounded-full" />
            </div>
            <div className="md:col-span-8 text-lg leading-relaxed text-zinc-400">
                <p>
                  I am a software engineer and cybersecurity researcher with a passion for building and deploying applications. I have experience in a variety of programming languages and frameworks, and I am always looking to learn new technologies and improve my skills. I enjoy creating projects which are meant to be used by system administrators. I am also interested in DevOps and cloud computing, and I have experience with AWS. I am a quick learner and a team player, and I am always looking for new challenges.
                </p>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
