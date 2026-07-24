import type { Metadata } from "next";
import { getPosts } from "../api/posts/getPosts";
import BlogList from "./components/BlogList";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on security research, infrastructure, and software by Mohamad Khawam.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getPosts();
  return (
    <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100">
         <div className="max-w-7xl mx-auto">
             <BlogList posts={posts} />
         </div>
    </div>
  );
}
