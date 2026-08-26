import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { featuredWork, gridProjects, getRepoStats } from "./projects/projects-data";
import { ProjectGrid } from "./projects/components/Projects";
import { getPosts } from "./api/posts/getPosts";

export const metadata: Metadata = {
  title: "Mohamad Khawam",
  description:
    "Application Developer at Rutgers University. I build and operate the platforms Rutgers CS and data science courses run on — grading infrastructure, JupyterHub automation, and the security work that keeps them standing.",
};

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      <h2
        id={id}
        className="text-xs font-mono uppercase tracking-[0.2em] text-base-content/50"
      >
        {children}
      </h2>
      <div className="h-px flex-1 bg-base-content/10" />
    </div>
  );
}

export default async function Home() {
  const stats = await getRepoStats();
  const posts = getPosts();

  return (
    <div className="min-h-dvh w-full p-8 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <div className="max-w-5xl mx-auto space-y-20 md:space-y-24">

        {/* Hero */}
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
            <a
              href="/scripts/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm md:btn-md bg-primary text-primary-content hover:bg-primary/90 border-none"
            >
              View CV
            </a>
            <a href="#work" className="btn btn-sm md:btn-md btn-ghost">
              Work
            </a>
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

        {/* About */}
        <section
          id="about"
          className="animate-rise scroll-mt-24 space-y-4"
          style={{ animationDelay: "120ms" }}
          aria-labelledby="about-heading"
        >
          <SectionLabel id="about-heading">About</SectionLabel>
          <p className="text-lg leading-relaxed text-base-content/70 max-w-prose">
            I&apos;m a software engineer and cybersecurity researcher who likes building
            things sysadmins actually run. Most of my work lives where application code
            meets the infrastructure under it — deployment automation, monitoring, and
            closing the security holes I find along the way. Outside work I served as
            Vice President of RUSecurity, where our team placed 4th in CCDC 2024.
          </p>
        </section>

        {/* Work — featured list + full grid */}
        <section
          id="work"
          className="animate-rise scroll-mt-24 space-y-6"
          style={{ animationDelay: "240ms" }}
          aria-labelledby="work-heading"
        >
          <SectionLabel id="work-heading">Selected Work</SectionLabel>

          <ul className="divide-y divide-base-content/5">
            {featuredWork.map((item) => (
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

          <div className="flex items-baseline gap-4 pt-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-base-content/50">
              More Projects
            </h3>
            <div className="h-px flex-1 bg-base-content/10" />
          </div>
          <ProjectGrid projects={gridProjects} stats={stats} />
        </section>

        {/* Writing */}
        <section
          id="blog"
          className="animate-rise scroll-mt-24 space-y-4"
          style={{ animationDelay: "360ms" }}
          aria-labelledby="blog-heading"
        >
          <SectionLabel id="blog-heading">Writing</SectionLabel>

          <ul className="divide-y divide-base-content/5">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/post/${post.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-baseline gap-x-6 gap-y-1 py-5"
                >
                  <time
                    dateTime={new Date(post.date).toISOString()}
                    className="shrink-0 sm:w-24 font-mono text-sm text-base-content/40 tabular-nums"
                  >
                    {format(new Date(post.date), "MMM yyyy")}
                  </time>
                  <span className="flex-1 min-w-0">
                    <span className="font-bold text-base-content group-hover:text-primary transition-colors">
                      {post.title}
                    </span>
                    <span className="block mt-0.5 text-sm text-base-content/60 leading-relaxed line-clamp-2">
                      {post.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="hidden sm:block shrink-0 translate-y-0.5 text-base-content/30 group-hover:text-primary transition-colors"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
