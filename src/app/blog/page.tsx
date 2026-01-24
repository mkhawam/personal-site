
import { getPosts } from "../api/posts/getPosts";
import BlogList from "./components/BlogList";

export default function BlogPage() {
  const posts = getPosts();
  return (
    <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
         <div className="max-w-7xl mx-auto">
             <BlogList posts={posts} />
         </div>
    </div>
  );
}
