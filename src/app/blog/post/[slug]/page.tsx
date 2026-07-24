import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/app/api/post/getPost";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { remark } from "remark";
import rehypePrism from "rehype-prism";
import "./post.css";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

// PrismJS languages
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-go";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";

const WORDS_PER_MINUTE = 200;

function readingTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / WORDS_PER_MINUTE));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      tags: post.tags,
      url: `/blog/post/${slug}`,
      images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const processedContent = await remark()
    .use(remarkRehype)
    .use(rehypePrism)
    .use(rehypeStringify)
    .process(post.content);

  const contentHtml = processedContent.toString();
  const minutes = readingTime(post.content);

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <article className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-base-content/50 hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft size={16} aria-hidden />
          All posts
        </Link>

        <header className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-base-content text-balance">
            {post.title}
          </h1>

          <p className="text-lg md:text-xl text-base-content/70 leading-relaxed">
            {post.description}
          </p>

          <p className="text-xs font-mono uppercase tracking-widest text-base-content/50">
            <time dateTime={new Date(post.date).toISOString()}>
              {format(new Date(post.date), "MMMM d, yyyy")}
            </time>
            {" · "}
            {post.author}
            {" · "}
            {minutes} min read
          </p>

          {post.tags?.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-base-content/5 border border-base-content/10 text-base-content/50"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        {post.image && (
          <div className="relative mt-10 aspect-[2/1] overflow-hidden rounded-2xl border border-base-content/5">
            <Image
              src={post.image}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div
          className="prose max-w-none mt-12 blog"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <footer className="mt-16 pt-8 border-t border-base-content/5">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-base-content/50 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} aria-hidden />
            All posts
          </Link>
        </footer>
      </article>
    </div>
  );
}
