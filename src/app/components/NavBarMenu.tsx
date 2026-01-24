'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, BookOpen, CheckSquare, FileText, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Projects', path: '/projects', icon: Briefcase },
  { name: 'Blog', path: '/blog', icon: BookOpen },
  { name: 'CV', path: '/cv', icon: FileText },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Contact', path: 'mailto:khawammohamad99@gmail.com', icon: Mail },
];

export function NavBarMenu() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-2 p-4 w-full">
      {navItems.map((item) => {
        const isActive = 
          item.path === '/' 
            ? pathname === '/'
            : pathname.startsWith(item.path) && item.path !== '/';

        return (
          <li key={item.name}>
            <Link href={item.path} className="relative block group">
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className={clsx(
                "relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                isActive 
                  ? "text-primary font-semibold" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-base">{item.name}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
