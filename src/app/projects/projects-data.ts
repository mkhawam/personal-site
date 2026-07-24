export type Project = {
    name: string;
    description: string;
    owner: string;
    repo: string;
    tags: string[];
    category: "work" | "personal";
    npm?: string; // package name, when the repo is published
};

export type RepoStats = {
    stars: number;
    forks: number;
    updatedAt: string;
};

export const projects: Project[] = [
    // ── Work · Rutgers LCSR ──────────────────────────────────────────────
    {
        name: "codePost API",
        description:
            "Django REST API behind codePost, the code review and grading platform used across Rutgers CS courses. Runs on a four-VM Docker Compose topology — data, backend, worker, frontend — with MariaDB, Redis and Celery workers behind Nginx over TLS; autograding runs on the Celery queue.",
        owner: "rutgers-lcsr",
        repo: "codePost-api",
        tags: ["Django", "Python", "Celery", "MariaDB", "Redis", "Docker", "Nginx"],
        category: "work",
    },
    {
        name: "codePost UI",
        description:
            "React and TypeScript frontend for codePost, built on Vite and tested with Vitest and Playwright. Drag-and-drop rubric reordering, collaborative code review, autograder test-case management, and cross-environment course tooling.",
        owner: "rutgers-lcsr",
        repo: "codePost-ui",
        tags: ["React", "TypeScript", "Vite", "Vitest", "Playwright", "Docker"],
        category: "work",
    },
    {
        name: "Accessibility Scanner",
        description:
            "Audits websites for accessibility issues and tracks them over time. A Flask API and Next.js interface drive Playwright and Axe scans through Celery workers, storing per-page results with screenshots so remediation progress is measurable across university domains.",
        owner: "rutgers-lcsr",
        repo: "Accessibility_Scanner",
        tags: ["Flask", "Next.js", "TypeScript", "Playwright", "Axe", "Celery", "Redis", "Docker"],
        category: "work",
    },
    {
        name: "next-cas-client",
        description:
            "Published npm package for CAS single sign-on in Next.js. Handles authentication, ticket validation and session management via iron-session, supporting CAS 2.0, CAS 3.0 and SAML 1.1 validation.",
        owner: "rutgers-lcsr",
        repo: "next-cas-client",
        tags: ["TypeScript", "Next.js", "CAS", "SAML", "Authentication"],
        category: "work",
        npm: "next-cas-client",
    },

    // ── Personal Projects ────────────────────────────────────────────────
    {
        name: "Jackal",
        description:
            "Network Behavior Analysis application that uses suricata to analyze network traffic and detect anomalies. By generated alerts by suricata, the application can detect and analyze network attacks. The application uses a web interface to display the alerts and provide a user-friendly way to analyze the data.",
        owner: "mkhawam",
        repo: "Jackal",
        tags: [
            "Python",
            "Flask",
            "Suricata",
            "Network Security",
            "Web Application",
            "Data Analysis",
            "Machine Learning",
            "React",
            "MongoDB",
            "Docker",
        ],
        category: "personal",
    },
    {
        name: "NetLock",
        description:
            "NetLock is a siem/command control server that is meant to be deployed quickly and without a lot of work from the end user. The goal is to create a C2 server that gives the blue team key insights into the landscape by documenting events happening around the network. It does this by using beacons which give event updates to the server using HTTPS.",
        owner: "rusec",
        repo: "NetLock",
        tags: ["NodeJS", "Express", "MongoDB", "Web Application", "Network Security", "Docker"],
        category: "personal",
    },
    {
        name: "CompLock",
        description:
            "CompLock helps blue teams control their machines from a centralized database. Built for blue team competitions where the team manages computers over SSH or LDAP, the CLI acts as a lightweight C2 server for rotating passwords across a fleet quickly. Used by RUSEC in CCDC, it cut password rotation across 30 machines from 5 minutes to 30 seconds.",
        owner: "rusec",
        repo: "CompLock",
        tags: ["NodeJS", "LevelDB", "CLI Application", "Network Security", "SSH", "LDAP"],
        category: "personal",
    },
    {
        name: "Job Application Tracker",
        description:
            "A node js application that allows a user to track their job application using their incoming emails. The application uses discord to send notifications to the user when a new job update is found and uses an LLM to parse the email extracting the relevant information.",
        owner: "mkhawam",
        repo: "AppTracker",
        tags: ["NodeJS", "LLM", "Bayesian", "Discord", "Automation", "Email", "NLP"],
        category: "personal",
    },
    {
        name: "pfSense API",
        description:
            "An API for pfSense that automates instance configuration, exposing create, read, update and delete operations for firewall rules. Builds on the work of jaredhendrickson13.",
        owner: "mkhawam",
        repo: "pfsense-api",
        tags: ["Pfsense", "API", "Automation", "Network Security", "Firewall"],
        category: "personal",
    },
    {
        name: "Windows Cloud-Init Script",
        description:
            "A OpenStack cloud-init script for windows. The script is used to automate the configuration of windows instances in OpenStack or Proxmox.",
        owner: "mkhawam",
        repo: "cloud-init",
        tags: ["Windows", "Cloud-Init", "OpenStack", "Proxmox", "Automation", "PowerShell"],
        category: "personal",
    },
    {
        name: "JobApps",
        description:
            "JobApps is a web application that allows users to track their job applications. The application uses a web interface to display the job applications and provide a user-friendly way to manage the data. Before Simplify was created.",
        owner: "mkhawam",
        repo: "JobApps",
        tags: ["Typescript", "React", "NodeJS", "Express", "LevelDB", "Web Application"],
        category: "personal",
    },
];

export const workProjects = projects.filter((p) => p.category === "work");
export const personalProjects = projects.filter((p) => p.category === "personal");

export function repoUrl(project: Project) {
    return `https://github.com/${project.owner}/${project.repo}`;
}

export function npmUrl(project: Project) {
    return project.npm ? `https://www.npmjs.com/package/${project.npm}` : null;
}

/**
 * Fetches repo stats on the server, cached for an hour.
 *
 * This used to run in the browser via useEffect, one request per card — eight
 * unauthenticated calls per pageview against GitHub's 60/hour/IP limit, so cards
 * started rendering "No data" after a handful of visits. Server-side with
 * revalidate means one set of requests per hour for all visitors combined.
 * GITHUB_TOKEN is optional and just raises the ceiling to 5000/hour.
 */
export async function getRepoStats(): Promise<Record<string, RepoStats>> {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const entries = await Promise.all(
        projects.map(async (project) => {
            const key = `${project.owner}/${project.repo}`;
            try {
                const res = await fetch(`https://api.github.com/repos/${key}`, {
                    headers,
                    next: { revalidate: 3600 },
                });
                if (!res.ok) return [key, null] as const;
                const data = await res.json();
                return [
                    key,
                    {
                        stars: data.stargazers_count ?? 0,
                        forks: data.forks_count ?? 0,
                        updatedAt: data.pushed_at ?? data.updated_at,
                    },
                ] as const;
            } catch {
                // A rate limit or outage degrades the card to name + description
                // rather than taking the page down.
                return [key, null] as const;
            }
        }),
    );

    return Object.fromEntries(entries.filter(([, stats]) => stats !== null)) as Record<string, RepoStats>;
}
