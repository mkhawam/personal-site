import type { Metadata } from "next";
import { Projects } from "./components/Projects";
import { getRepoStats } from "./projects-data";

export const metadata: Metadata = {
    title: "Projects",
    description:
        "Open-source work by Mohamad Khawam — network security tooling, infrastructure automation, and full-stack applications.",
};

export default async function ProjectsPage() {
    // Fetched here rather than per-card in the browser, so the page survives
    // GitHub's unauthenticated rate limit. See getRepoStats().
    const stats = await getRepoStats();

    return (
        <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-base-content tracking-tight">
                        Projects
                    </h1>
                    <p className="mt-4 text-lg text-base-content/70 max-w-prose">
                        Platform work at Rutgers LCSR, plus security tooling and the occasional
                        thing built to scratch my own itch.
                    </p>
                </header>
                <Projects stats={stats} />
            </div>
        </div>
    );
}
