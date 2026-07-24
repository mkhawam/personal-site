'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, BookOpen, CheckSquare, FileText, Mail, TerminalSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Projects', path: '/projects', icon: Briefcase },
  { name: 'Playground', path: '/playground', icon: TerminalSquare },
  { name: 'Blog', path: '/blog', icon: BookOpen },
  // /cv has no route on purpose — it lands in the shell on the 404 page.
  { name: 'CV', path: '/cv', icon: FileText },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare, authOnly: true },
  { name: 'Contact', path: 'mailto:khawammohamad99@gmail.com', icon: Mail },
];

export function NavBarMenu({ isAuthed = false }: { isAuthed?: boolean }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-2 p-4 w-full">
      {navItems.filter((item) => !item.authOnly || isAuthed).map((item) => {
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
                  : "text-base-content/70 hover:text-base-content hover:bg-base-content/5"
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
