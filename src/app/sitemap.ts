import type { MetadataRoute } from "next";
import { getAllPosts } from "./api/posts/getPosts";
import { SITE_URL } from "./layout";

export default function sitemap(): MetadataRoute.Sitemap {
    const posts = getAllPosts();

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
        { url: `${SITE_URL}/projects`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ];

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${SITE_URL}/blog/post/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "yearly",
        priority: 0.6,
    }));

    return [...staticRoutes, ...postRoutes];
}
