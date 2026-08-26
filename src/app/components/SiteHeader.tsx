import Link from "next/link";
import CommandHint from "./CommandHint";
import ThemeController from "./ThemeController";

/**
 * Slim sticky top bar — the whole site's navigation. Anchor links use full
 * /#section hrefs so they work from any route (blog posts, playground), not
 * just the home page.
 */

const NAV_LINKS = [
    { label: "About", href: "/#about" },
    { label: "Work", href: "/#work" },
    { label: "Writing", href: "/#blog" },
    { label: "Contact", href: "/#contact" },
];

const LINK_CLASS =
    "shrink-0 px-2 py-1 text-sm text-base-content/70 hover:text-primary transition-colors";

export default function SiteHeader({ isAuthed = false }: { isAuthed?: boolean }) {
    return (
        <header className="sticky top-0 z-50 border-b border-base-content/5 bg-base-100/80 backdrop-blur">
            <nav
                aria-label="Site"
                className="max-w-5xl mx-auto flex items-center gap-1 h-14 px-4 md:px-6 overflow-x-auto"
            >
                <Link
                    href="/"
                    className="shrink-0 mr-2 font-bold tracking-tight text-base-content"
                >
                    <span className="hidden sm:inline">Mohamad Khawam</span>
                    <span className="sm:hidden font-mono">mk</span>
                </Link>

                {NAV_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className={LINK_CLASS}>
                        {link.label}
                    </Link>
                ))}
                <a
                    href="/scripts/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_CLASS}
                >
                    CV
                </a>
                {isAuthed && (
                    <Link href="/tasks" className={LINK_CLASS}>
                        Tasks
                    </Link>
                )}

                <div className="ml-auto flex items-center gap-2 shrink-0 pl-2">
                    <CommandHint />
                    <ThemeController />
                </div>
            </nav>
        </header>
    );
}
