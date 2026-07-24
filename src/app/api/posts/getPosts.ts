import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PostResponse } from "../../../types/blog";

const postsDir = path.join(process.cwd(), "posts");

/** Every post, newest first. Used by the sitemap, which must not be truncated. */
export function getAllPosts(): PostResponse[] {
    const files = fs.readdirSync(postsDir);
    const posts: PostResponse[] = files.map((file) => {
        const content = fs.readFileSync(path.join(postsDir, file), "utf-8");
        const { data } = matter(content);
        const { title, description, date, tags } = data;

        return {
            title,
            description,
            date: new Date(date).getTime(),
            author: data.author || "Unknown",
            author_image: data.author_image || "/default.png",
            tags: tags || [],
            slug: file.replace(/\.(md|MD)$/, ""),
            image: data.image || "/default.png",
        };
    });

    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** The first page of posts, for the blog index. */
export function getPosts(): PostResponse[] {
    return getAllPosts().slice(0, 10);
}
