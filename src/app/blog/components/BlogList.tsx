'use client';

import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";

type Post = {
    slug: string;
    title: string;
    date: number;
    description: string;
    tags: string[];
    author: string;
    image: string;
};

export default function BlogList({ posts }: { posts: Post[] }) {
    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.4, ease: "easeOut" as const }
        }
    };

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl md:text-6xl font-extrabold text-base-content tracking-tight">
                    Blog
                </h1>
                <h2 className="text-xl mt-4 text-base-content/50">Thoughts, guides, and rants.</h2>
            </motion.div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20"
            >
                {posts.map((post) => (
                    <motion.div
                        key={post.slug}
                        variants={item}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        viewport={{ once: true }}
                        className="group overflow-hidden rounded-3xl bg-base-200/50 border border-base-content/5 shadow-lg hover:shadow-2xl hover:border-base-content/20 flex flex-col md:flex-row h-full min-h-[250px]"
                    >
                        <div className="md:w-2/5 relative overflow-hidden bg-black/50">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" 
                                src={post.image} 
                                alt={post.title} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>

                        <div className="p-6 md:w-3/5 flex flex-col">
                            <div className="mb-4">
                                <h2 className="card-title text-2xl font-bold mb-2 text-base-content group-hover:text-primary transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-xs font-mono text-base-content/50 uppercase tracking-widest">
                                    {format(new Date(post.date), "MMMM dd, yyyy")} • {post.author}
                                </p>
                            </div>
                            
                            <p className="text-base-content/70 line-clamp-3 mb-4 flex-1">
                                {post.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="px-2 py-0.5 rounded text-xs bg-base-300/60 border border-base-content/5 text-base-content/50">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="card-actions justify-end mt-auto">
                                <Link
                                    href={`/blog/post/${post.slug}`}
                                    className="text-sm font-bold text-accent hover:text-accent/70 transition-colors flex items-center gap-1"
                                    aria-label={`Read ${post.title}`}
                                >
                                    Read Article →
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </>
    );
}
