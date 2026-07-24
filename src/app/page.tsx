import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, GitCommitHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getRecentActivity } from "@/lib/github";

export const metadata: Metadata = {
  title: "Mohamad Khawam",
  description:
    "Application Developer at Rutgers University. I build and operate the platforms Rutgers CS and data science courses run on — grading infrastructure, JupyterHub automation, and the security work that keeps them standing.",
};

type WorkLink = { label: string; href: string };

const selectedWork: {
  name: string;
  summary: string;
  stack: string[];
  links?: WorkLink[];
}[] = [
  {
    name: "codePost",
    summary:
      "Full-stack code grading platform — Django API, React UI, Celery workers — across 4 VMs, serving 500+ students per semester with autograding, per-cell Jupyter evaluation, and AI-assisted comment generation.",
    stack: ["Django", "React", "Celery", "Docker"],
    links: [
      { label: "API", href: "https://github.com/rutgers-lcsr/codePost-api" },
      { label: "UI", href: "https://github.com/rutgers-lcsr/codePost-ui" },
    ],
  },
  {
    name: "jupyter-assignments",
    summary:
      "JupyterLab sidebar extension with a 4-tier role system and a platform adapter pattern that puts codePost and Autolab behind one interface, so assignments are managed without leaving the editor.",
    stack: ["TypeScript", "React", "Python", "JupyterLab"],
  },
  {
    name: "JupyterHub automation",
    summary:
      "Ansible-managed JupyterHub deployment across course servers, handling CAS/Kerberos/Azure auth, Python versioning, modular extensions, and Zabbix monitoring.",
    stack: ["Ansible", "Kerberos", "Zabbix", "Linux"],
  },
  {
    name: "Accessibility Scanner",
    summary:
      "Flask API and Next.js interface driving Playwright and Axe scans through Celery workers, tracking accessibility issues over time with per-page screenshots so remediation progress is measurable across university domains.",
    stack: ["Flask", "Next.js", "Playwright", "Axe", "Celery"],
    links: [{ label: "GitHub", href: "https://github.com/rutgers-lcsr/Accessibility_Scanner" }],
  },
];

export default async function Home() {
  const activity = await getRecentActivity(4);

  return (
    <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <div className="max-w-4xl mx-auto space-y-16 md:space-y-20">

        {/* Header */}
        <header className="animate-rise space-y-5">
          <p className="text-xs md:text-sm font-mono uppercase tracking-[0.2em] text-primary">
            Application Developer · Rutgers University
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-base-content tracking-tight">
            Mohamad Khawam
          </h1>
          <p className="text-xl md:text-2xl text-base-content/70 font-light max-w-2xl leading-relaxed">
            I build and operate the platforms Rutgers CS and data science courses run
            on — grading infrastructure, JupyterHub automation, and the security work
            that keeps them standing.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/cv"
              className="btn btn-sm md:btn-md bg-primary text-primary-content hover:bg-primary/90 border-none"
            >
              View CV
            </Link>
            <Link href="/projects" className="btn btn-sm md:btn-md btn-ghost">
              Projects
            </Link>
            <a
              href="https://github.com/mkhawam"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm md:btn-md btn-ghost"
            >
              GitHub
              <ArrowUpRight size={16} aria-hidden />
            </a>
          </div>
        </header>

        {/* Currently — live GitHub pulse (server-fetched, hourly cache) */}
        {activity.length > 0 && (
          <section
            className="animate-rise space-y-4"
            style={{ animationDelay: "80ms" }}
            aria-labelledby="currently"
          >
            <div className="flex items-baseline gap-4">
              <h2
                id="currently"
                className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-base-content/50"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Currently
              </h2>
              <div className="h-px flex-1 bg-base-content/10" />
            </div>

            <ul className="space-y-1.5">
              {activity.map((item) => (
                <li key={`${item.repo}-${item.at}`}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline gap-3 text-sm py-1"
                  >
                    <GitCommitHorizontal
                      size={15}
                      className="shrink-0 translate-y-0.5 text-base-content/40 group-hover:text-primary transition-colors"
                      aria-hidden
                    />
                    <span className="font-mono text-base-content/80 group-hover:text-primary transition-colors">
                      {item.repo}
                    </span>
                    <span className="text-base-content/50">{item.detail}</span>
                    <span className="ml-auto shrink-0 text-xs text-base-content/40 tabular-nums">
                      {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Selected Work */}
        <section
          className="animate-rise space-y-6"
          style={{ animationDelay: "120ms" }}
          aria-labelledby="selected-work"
        >
          <div className="flex items-baseline gap-4">
            <h2
              id="selected-work"
              className="text-xs font-mono uppercase tracking-[0.2em] text-base-content/50"
            >
              Selected Work
            </h2>
            <div className="h-px flex-1 bg-base-content/10" />
          </div>

          <ul className="divide-y divide-base-content/5">
            {selectedWork.map((item) => (
              <li key={item.name} className="py-6 first:pt-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xl md:text-2xl font-bold text-base-content">
                    {item.name}
                  </h3>
                  {item.links && (
                    <span className="flex items-center gap-2 text-sm">
                      {item.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          {link.label}
                          <ArrowUpRight size={13} aria-hidden />
                        </a>
                      ))}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-base-content/70 leading-relaxed max-w-prose">
                  {item.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-base-content/5 border border-base-content/10 text-base-content/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* About */}
        <section
          className="animate-rise space-y-4"
          style={{ animationDelay: "240ms" }}
          aria-labelledby="about"
        >
          <div className="flex items-baseline gap-4">
            <h2
              id="about"
              className="text-xs font-mono uppercase tracking-[0.2em] text-base-content/50"
            >
              About
            </h2>
            <div className="h-px flex-1 bg-base-content/10" />
          </div>
          <p className="text-lg leading-relaxed text-base-content/70 max-w-prose">
            I&apos;m a software engineer and cybersecurity researcher who likes building
            things sysadmins actually run. Most of my work lives where application code
            meets the infrastructure under it — deployment automation, monitoring, and
            closing the security holes I find along the way. Outside work I served as
            Vice President of RUSecurity, where our team placed 4th in CCDC 2024.
          </p>
        </section>

        {/* Footer quote */}
        <footer
          className="animate-rise border-t border-base-content/5 pt-8 pb-4"
          style={{ animationDelay: "360ms" }}
        >
          <blockquote className="text-base md:text-lg italic font-serif text-base-content/50 max-w-prose">
            &quot;You have light and peace inside of you. If you let it out, you can change
            the world around you.&quot;
            <cite className="not-italic block mt-2 text-sm font-sans tracking-wide uppercase text-base-content/40">
              — Uncle Iroh
            </cite>
          </blockquote>
        </footer>
      </div>
    </div>
  );
}
