import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PostResponse } from "@/types/blog";

const postsDir = path.join(process.cwd(), "posts");

export function getPosts() {
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

    // get initial posts
    const initialPosts = posts
        .sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 10);
    return initialPosts;
}
