'use client';

import { motion } from "framer-motion";
import { format } from "date-fns";

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
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-100 tracking-tight">
                    Blog
                </h1>
                <h2 className="text-xl mt-4 text-zinc-500">Thoughts, guides, and rants.</h2>
            </motion.div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 opacity-0"
            >
                {posts.map((post) => (
                    <motion.div
                        key={post.slug}
                        variants={item}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        viewport={{ once: true }}
                        className="group overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 shadow-lg hover:shadow-2xl hover:border-white/20 flex flex-col md:flex-row h-full min-h-[250px]"
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
                                <h2 className="card-title text-2xl font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                    {format(new Date(post.date), "MMMM dd, yyyy")} • {post.author}
                                </p>
                            </div>
                            
                            <p className="text-zinc-400 line-clamp-3 mb-4 flex-1">
                                {post.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="px-2 py-0.5 rounded text-xs bg-black/40 border border-white/5 text-zinc-500">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="card-actions justify-end mt-auto">
                                <a
                                    href={`/blog/post/${post.slug}`}
                                    className="text-sm font-bold text-accent hover:text-white transition-colors flex items-center gap-1"
                                >
                                    Read Article →
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </>
    );
}
