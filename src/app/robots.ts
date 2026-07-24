import type { MetadataRoute } from "next";
import { SITE_URL } from "./layout";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // /tasks is a private app behind Discord auth; /api and /login have
            // nothing worth indexing.
            disallow: ["/tasks", "/api/", "/login"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
