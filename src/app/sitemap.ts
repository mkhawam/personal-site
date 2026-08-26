import type { MetadataRoute } from "next";
import { getAllPosts } from "./api/posts/getPosts";
import { SITE_URL } from "./layout";

export default function sitemap(): MetadataRoute.Sitemap {
    const posts = getAllPosts();

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
        { url: `${SITE_URL}/playground`, changeFrequency: "monthly", priority: 0.5 },
    ];

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${SITE_URL}/blog/post/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "yearly",
        priority: 0.6,
    }));

    return [...staticRoutes, ...postRoutes];
}
