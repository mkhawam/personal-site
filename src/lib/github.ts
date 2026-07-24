/**
 * Recent public GitHub activity for the home-page "Currently" pulse.
 *
 * Same discipline as getRepoStats() in app/projects/projects-data.ts: fetched
 * server-side, cached for an hour so the whole site shares one request against
 * GitHub's 60/hour/IP unauthenticated limit; GITHUB_TOKEN optional; failures
 * degrade to an empty list rather than throwing.
 */

const GH_USER = "mkhawam";

export type Activity = {
    type: "push" | "create" | "pr" | "release";
    repo: string;
    detail: string;
    url: string;
    at: string; // ISO timestamp
};

type GitHubEvent = {
    type: string;
    repo: { name: string };
    created_at: string;
    payload: {
        size?: number;
        ref?: string;
        ref_type?: string;
        action?: string;
        pull_request?: { html_url?: string; title?: string };
        release?: { html_url?: string; tag_name?: string };
    };
};

export async function getRecentActivity(limit = 5): Promise<Activity[]> {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
        const res = await fetch(`https://api.github.com/users/${GH_USER}/events/public`, {
            headers,
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const events: GitHubEvent[] = await res.json();

        const activity: Activity[] = [];
        const seenRepos = new Set<string>();

        for (const ev of events) {
            const repo = ev.repo?.name;
            if (!repo) continue;

            if (ev.type === "PushEvent") {
                // One entry per repo per pulse — collapse a burst of pushes.
                if (seenRepos.has(repo)) continue;
                seenRepos.add(repo);
                const n = ev.payload.size ?? 1;
                const branch = ev.payload.ref?.replace("refs/heads/", "") ?? "";
                activity.push({
                    type: "push",
                    repo,
                    detail: `pushed ${n} commit${n === 1 ? "" : "s"}${branch ? ` to ${branch}` : ""}`,
                    url: `https://github.com/${repo}`,
                    at: ev.created_at,
                });
            } else if (ev.type === "PullRequestEvent" && ev.payload.action === "opened") {
                activity.push({
                    type: "pr",
                    repo,
                    detail: `opened a pull request`,
                    url: ev.payload.pull_request?.html_url ?? `https://github.com/${repo}`,
                    at: ev.created_at,
                });
            } else if (ev.type === "ReleaseEvent") {
                activity.push({
                    type: "release",
                    repo,
                    detail: `released ${ev.payload.release?.tag_name ?? "a version"}`,
                    url: ev.payload.release?.html_url ?? `https://github.com/${repo}`,
                    at: ev.created_at,
                });
            } else if (ev.type === "CreateEvent" && ev.payload.ref_type === "repository") {
                activity.push({
                    type: "create",
                    repo,
                    detail: `created the repository`,
                    url: `https://github.com/${repo}`,
                    at: ev.created_at,
                });
            }

            if (activity.length >= limit) break;
        }

        return activity;
    } catch {
        return [];
    }
}
