import { FaGithub } from "react-icons/fa";
import { Star } from "lucide-react";
import { format } from "date-fns";
import type { RepoStats } from "../projects-data";

/**
 * Compact repo stat line for a project card corner. Purely presentational —
 * the data is fetched and cached server-side in projects-data.ts.
 */
export function Github({ stats }: { stats?: RepoStats }) {
    if (!stats) {
        return <FaGithub size={20} aria-hidden />;
    }

    return (
        <div className="flex items-center gap-3 text-xs font-mono whitespace-nowrap">
            {stats.stars > 0 && (
                <span className="flex items-center gap-1" title={`${stats.stars} stars`}>
                    <Star size={12} aria-hidden />
                    {stats.stars}
                </span>
            )}
            <span title="Last pushed">{format(new Date(stats.updatedAt), "MMM yyyy")}</span>
            <FaGithub size={18} aria-hidden />
        </div>
    );
}
