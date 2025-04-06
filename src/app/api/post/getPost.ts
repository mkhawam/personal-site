import matter from "gray-matter";
import fs from "fs";
import path from "path";
import { Post } from "@/types/blog";

const postsDir = path.join(process.cwd(), "posts");

export function getPost(slug: string): Post | null {
    const files = fs.readdirSync(postsDir);
    for (const file of files) {
        if (file.replace(/\.(md|MD)$/, "") !== slug) {
            continue;
        }
        const fileContent = fs.readFileSync(path.join(postsDir, file), "utf-8");
        const { data, content } = matter(fileContent);
        const { title, description, date, tags, author, author_image, image } = data;
        return { title, description, date, tags, author, author_image, content, slug, image };
    }
    return null;
}
