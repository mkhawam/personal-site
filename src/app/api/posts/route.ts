import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PostResponse } from "@/types/blog";

const postsDir = path.join(process.cwd(), "posts");

export function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q") || "";
    const tag = request.nextUrl.searchParams.get("tag") || "";
    const limit = request.nextUrl.searchParams.get("limit") || "10";
    const offset = request.nextUrl.searchParams.get("offset") || "0";
    const sort = request.nextUrl.searchParams.get("sort") || "date";
    const order = request.nextUrl.searchParams.get("order") || "desc";

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

    // check for query params
    let filteredPosts = posts.filter((post) => {
        if (query) {
            return post.title.toLowerCase().includes(query.toLowerCase()) || post.description.toLowerCase().includes(query.toLowerCase());
        }
        return true;
    });

    // check tag
    if (tag) {
        filteredPosts = filteredPosts.filter((post) => post.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    }
    // check for sort params
    if (sort) {
        filteredPosts.sort((a, b) => {
            if (sort === "date") {
                return order === "asc" ? a.date - b.date : b.date - a.date;
            } else {
                return 0;
            }
        });
    }
    // check for pageination params
    const start = parseInt(offset) || 0;
    const end = parseInt(limit) || 10;
    const paginatedPosts = filteredPosts.slice(start, start + end);
    if (paginatedPosts.length === 0) {
        return new Response(JSON.stringify({ message: "No posts found" }), {
            status: 404,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
            },
        });
    }

    return new Response(JSON.stringify(paginatedPosts), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });
}
