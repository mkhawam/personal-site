import matter from "gray-matter";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { Post } from "@/types/blog";
const postsDir = path.join(process.cwd(), "posts");

export function getPost(slug: string) {
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

export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug) {
        return new Response(JSON.stringify({}), { status: 400 });
    }

    const files = fs.readdirSync(postsDir);
    for (const file of files) {
        if (file.replace(/\.(md|MD)$/, "") !== slug) {
            continue;
        }
        const fileContent = fs.readFileSync(path.join(postsDir, file), "utf-8");
        const { data, content } = matter(fileContent);
        const { title, description, date, tags, author, author_image, image } = data;
        return new NextResponse<Post>(JSON.stringify({ title, description, date, tags, author, author_image, content, slug, image }), {
            status: 200,
        });
    }
    return new Response(JSON.stringify({}), { status: 404 });
}
