export type Post = {
    title: string;
    description: string;
    author: string;
    author_image: string;
    date: number;
    tags: string[];
    content: string;
    slug: string;
    image: string;
};

export type PostResponse = {
    title: string;
    description: string;
    author: string;
    author_image: string;
    date: number;
    tags: string[];
    slug: string;
    image: string;
};
