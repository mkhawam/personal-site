import { getPosts } from "../api/posts/getPosts";

export default function BlogPage() {
    const posts = getPosts();
    return (
        <div className="grow bg-base-300 text-base-content min-h-screen p-8 pb-20 select-none">
            <div className="">
                <div className="text-5xl">Blog</div>
            </div>
            <div className="mt-4">
                <div className="text-3xl">Latest Posts</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-5">
                    {posts.map((post) => (
                        <div key={post.slug} className="card card-side bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                            <figure >
                                <img src={post.image} alt={post.title} className="rounded-lg" />
                            </figure>

                            <div className="card-body">
                                <h2 className="card-title">{post.title}</h2>
                                <p>{post.description}</p>
                                <div className="card-actions justify-end">
                                    <a href={`/blog/post/${post.slug}`} className="btn btn-primary mt-4">Read More</a>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}