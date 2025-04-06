import { getPost } from "@/app/api/post/route";
import { format } from "date-fns";
import { redirect } from 'next/navigation';
import { remark } from "remark";
import rehypePrism from "rehype-prism";
import "./post.css";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

// PrismJS languages
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';

export default async function Post({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;

    if (typeof slug !== "string") {
        return redirect("/not-found/post/" + slug);
    }


    const post = getPost(slug);

    if (!post) {
        return redirect("/not-found/post/" + slug);
    }

    const processedContent = await remark()
        .use(remarkRehype)
        .use(rehypePrism)
        .use(rehypeStringify)
        .process(post.content);

    const contentHtml = processedContent.toString();
    return (
        <div className="grow bg-base-300 text-base-content min-h-screen p-8 pb-20 select-none">
            <div className="">
                <div className="text-5xl">{post.title}</div>
            </div>
            <div className="mt-4">
                <div className="text-3xl">{post.description}</div>
                <div className="text-xl mt-5">Authored by {post.author} - {format(post.date, "M/d/yy")}</div>
                <div className="mt-4">
                    <img src={post.image} alt={post.title} className="rounded-lg" />
                </div>

                <div className="prose max-w-none mt-4 blog select-text" dangerouslySetInnerHTML={{ __html: contentHtml }} />

            </div>
        </div>
    );
}