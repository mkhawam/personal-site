import { format } from "date-fns";
import { getPosts } from "../api/posts/getPosts";

export default function BlogPage() {
  const posts = getPosts();
  return (
    <div className="grow bg-base-300 text-base-content min-h-screen p-8 pb-20 select-none">
      <div className="">
        <div className="md:text-5xl text-xl">Blog</div>
      </div>
      <div className="mt-4">
        <div className="md:text-3xl text-xl">Latest Posts</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-5">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="card card-side bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out"
            >
              <figure>
                <img className="w-48 h-full object-cover" src={post.image} alt={post.title} />
              </figure>

              <div className="card-body">
                <h2 className="card-title">{post.title}</h2>
                <p>
                  {post.author} - {format(post.date, "MMMM dd, yyyy")}
                </p>
                <p>{post.description}</p>
                <div className="mt-4">
                  <div className="text-2xl">Tags:</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="badge badge-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card-actions justify-end">
                  <a
                    href={`/blog/post/${post.slug}`}
                    className="btn btn-primary mt-4"
                  >
                    Read More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
