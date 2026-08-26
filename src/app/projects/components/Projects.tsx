'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { Github } from "./Github";
import { repoUrl, npmUrl, type Project, type RepoStats } from "../projects-data";

function ProjectCard({ project, stats }: { project: Project; stats?: RepoStats }) {
    const npm = npmUrl(project);
    return (
        <motion.article
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative flex flex-col h-full overflow-hidden rounded-3xl bg-base-200/50 border border-base-content/5 hover:border-base-content/20 hover:shadow-2xl hover:shadow-base-content/5"
        >
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-base-content group-hover:text-primary transition-colors duration-300">
                        {project.name}
                    </h3>
                    <div className="text-base-content/50 group-hover:text-base-content/80 transition-colors mt-1">
                        <Github stats={stats} />
                    </div>
                </div>

                <p className="text-base-content/70 leading-relaxed mb-6 flex-1 max-w-prose">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                    {project.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-base-content/5 border border-base-content/10 text-base-content/50 group-hover:border-base-content/20 group-hover:text-base-content/80 transition-colors"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-base-300/40 border-t border-base-content/5 flex justify-end gap-1">
                {project.demo && (
                    <Link
                        href={project.demo}
                        className="btn btn-sm btn-ghost hover:bg-base-content/10 transition-all"
                        aria-label={`Open the ${project.name} live demo`}
                    >
                        Live demo
                    </Link>
                )}
                {npm && (
                    <a
                        href={npm}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-ghost hover:bg-base-content/10 transition-all"
                        aria-label={`View ${project.name} on npm`}
                    >
                        npm
                    </a>
                )}
                <a
                    href={repoUrl(project)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-ghost hover:bg-primary/90 hover:text-primary-content transition-all"
                    aria-label={`View ${project.name} on GitHub`}
                >
                    View Project
                </a>
            </div>
        </motion.article>
    );
}

export function ProjectGrid({
    projects,
    stats,
}: {
    projects: Project[];
    stats: Record<string, RepoStats>;
}) {
    // No entrance animation: framer-motion's initial state writes inline
    // opacity:0, which blanks the server-rendered grid until scripts run
    // (see the animate-rise note in globals.css). Hover motion only.
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
                <ProjectCard
                    key={project.name}
                    project={project}
                    stats={stats[`${project.owner}/${project.repo}`]}
                />
            ))}
        </div>
    );
}
